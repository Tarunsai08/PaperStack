"""LLM access for the pipeline: OpenAI-compatible providers with fallback.

- Providers are tried in the order given in config.yaml.
- Each provider has a rate limit (requests per minute) and exponential backoff on
  transient errors (2s, 4s, 8s, 16s) before falling back to the next provider.
- Responses are cached on disk by a hash of the request, so re-running the
  pipeline never pays twice for the same call.
- Every response records which provider and model produced it, which becomes the
  article's `generated_by` field.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from log import log_event

ROOT = Path(__file__).resolve().parent
CACHE_DIR = ROOT / "cache" / "llm"

TRANSIENT_STATUS = {408, 409, 429, 500, 502, 503, 504}


class LLMError(Exception):
    pass


@dataclass
class Provider:
    name: str
    base_url: str
    model: str
    api_key_env: str = ""
    requests_per_minute: int = 10
    max_input_tokens: int = 30000
    last_call: float = 0.0
    _client: Any = field(default=None, repr=False)

    @property
    def is_local(self) -> bool:
        return not self.api_key_env

    @property
    def api_key(self) -> str | None:
        if self.is_local:
            return "ollama"
        return os.environ.get(self.api_key_env) or None

    @property
    def tag(self) -> str:
        """Value used for generated_by, e.g. 'groq-llama-3.3-70b-versatile'."""
        return re.sub(r"[^a-z0-9.-]+", "-", f"{self.name}-{self.model}".lower()).strip("-")

    def client(self):
        if self._client is None:
            from openai import OpenAI  # imported lazily so tests do not need the SDK

            self._client = OpenAI(base_url=self.base_url, api_key=self.api_key, timeout=180, max_retries=0)
        return self._client

    def wait_for_rate_limit(self, sleep: Callable[[float], None] = time.sleep) -> None:
        interval = 60.0 / max(1, self.requests_per_minute)
        delta = time.monotonic() - self.last_call
        if self.last_call and delta < interval:
            sleep(interval - delta)
        self.last_call = time.monotonic()


@dataclass
class Completion:
    text: str
    provider: str
    model: str
    generated_by: str
    cached: bool = False


def load_providers(config: dict, only: str | None = None) -> list[Provider]:
    use_local = os.environ.get("PAPERSTACK_USE_LOCAL") == "1"
    out = []
    for p in config.get("providers", []):
        prov = Provider(
            name=p["name"],
            base_url=p["base_url"],
            model=p["model"],
            api_key_env=p.get("api_key_env", "") or "",
            requests_per_minute=int(p.get("requests_per_minute", 10)),
            max_input_tokens=int(p.get("max_input_tokens", config.get("max_input_tokens", 30000))),
        )
        if only and prov.name != only:
            continue
        if prov.is_local and not (use_local or only == prov.name):
            continue
        if not prov.api_key:
            continue
        out.append(prov)
    return out


def _status_of(err: Exception) -> int | None:
    for attr in ("status_code", "status", "http_status"):
        v = getattr(err, attr, None)
        if isinstance(v, int):
            return v
    resp = getattr(err, "response", None)
    v = getattr(resp, "status_code", None)
    return v if isinstance(v, int) else None


def is_transient(err: Exception) -> bool:
    status = _status_of(err)
    if status is not None:
        return status in TRANSIENT_STATUS
    name = type(err).__name__
    return any(k in name for k in ("Timeout", "Connection", "RateLimit", "InternalServer"))


def cache_key(model: str, messages: list[dict], temperature: float, json_mode: bool) -> str:
    blob = json.dumps({"m": model, "msg": messages, "t": temperature, "j": json_mode}, sort_keys=True)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


class LLM:
    def __init__(
        self,
        providers: list[Provider],
        cache_dir: Path = CACHE_DIR,
        sleep: Callable[[float], None] = time.sleep,
        max_retries: int = 4,
    ):
        if not providers:
            raise LLMError("No LLM provider is available. Set GEMINI_API_KEY or GROQ_API_KEY, or use --provider ollama.")
        self.providers = providers
        self.cache_dir = cache_dir
        self.sleep = sleep
        self.max_retries = max_retries

    def _call(self, prov: Provider, messages: list[dict], temperature: float, json_mode: bool) -> str:
        kwargs: dict[str, Any] = dict(model=prov.model, messages=messages, temperature=temperature)
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        try:
            resp = prov.client().chat.completions.create(**kwargs)
        except Exception as e:  # some providers reject response_format; retry once without it
            if json_mode and _status_of(e) == 400:
                kwargs.pop("response_format", None)
                resp = prov.client().chat.completions.create(**kwargs)
            else:
                raise
        text = resp.choices[0].message.content or ""
        if not text.strip():
            raise LLMError(f"{prov.name} returned an empty response")
        return text

    def complete(
        self,
        messages: list[dict] | Callable[[Provider], list[dict]],
        temperature: float = 0.4,
        json_mode: bool = False,
    ) -> Completion:
        """`messages` may be a function of the provider, so each one can get a prompt sized for its limits."""
        errors: list[str] = []
        for prov in self.providers:
            msgs = messages(prov) if callable(messages) else messages
            key = cache_key(prov.model, msgs, temperature, json_mode)
            path = self.cache_dir / f"{key}.json"
            if path.exists():
                data = json.loads(path.read_text(encoding="utf-8"))
                log_event("llm_cache_hit", provider=prov.name, model=prov.model)
                return Completion(data["text"], prov.name, prov.model, prov.tag, cached=True)

            for attempt in range(self.max_retries + 1):
                prov.wait_for_rate_limit(self.sleep)
                started = time.monotonic()
                try:
                    text = self._call(prov, msgs, temperature, json_mode)
                except Exception as e:  # noqa: BLE001 - we classify below
                    transient = is_transient(e)
                    log_event("llm_error", provider=prov.name, model=prov.model, attempt=attempt, transient=transient, error=str(e)[:300])
                    if transient and attempt < self.max_retries:
                        self.sleep(2 ** (attempt + 1))
                        continue
                    errors.append(f"{prov.name}: {e}")
                    break
                log_event("llm_ok", provider=prov.name, model=prov.model, seconds=round(time.monotonic() - started, 2), chars=len(text))
                self.cache_dir.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps({"text": text, "provider": prov.name, "model": prov.model}), encoding="utf-8")
                return Completion(text, prov.name, prov.model, prov.tag)
        raise LLMError("All providers failed: " + " | ".join(errors))


def extract_json(text: str) -> dict:
    """Parse a JSON object from a model reply, tolerating code fences and chatter."""
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*", "", t)
    t = re.sub(r"\s*```$", "", t)
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        start, end = t.find("{"), t.rfind("}")
        if start >= 0 and end > start:
            return json.loads(t[start : end + 1])
        raise
