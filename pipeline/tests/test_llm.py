import json

import pytest

from llm import LLM, LLMError, Provider, extract_json, load_providers


class FakeError(Exception):
    def __init__(self, status):
        super().__init__(f"status {status}")
        self.status_code = status


def make_provider(name, script):
    """A provider whose client returns or raises the scripted items in order."""
    prov = Provider(name=name, base_url="http://x", model=f"{name}-model", api_key_env="", requests_per_minute=6000)
    calls = []

    class Completions:
        def create(self, **kw):
            calls.append(kw)
            item = script.pop(0)
            if isinstance(item, Exception):
                raise item
            msg = type("M", (), {"content": item})
            choice = type("C", (), {"message": msg})
            return type("R", (), {"choices": [choice]})

    prov._client = type("Client", (), {"chat": type("Chat", (), {"completions": Completions()})()})()
    return prov, calls


MSGS = [{"role": "user", "content": "hi"}]


def test_falls_back_to_next_provider_on_hard_error(tmp_path):
    a, a_calls = make_provider("alpha", [FakeError(401)])
    b, b_calls = make_provider("beta", ["hello from beta"])
    llm = LLM([a, b], cache_dir=tmp_path, sleep=lambda s: None)
    out = llm.complete(MSGS)
    assert out.text == "hello from beta"
    assert out.provider == "beta" and out.generated_by == "beta-beta-model"
    assert len(a_calls) == 1 and len(b_calls) == 1


def test_retries_transient_errors_with_backoff(tmp_path):
    sleeps = []
    a, calls = make_provider("alpha", [FakeError(429), FakeError(503), "ok"])
    llm = LLM([a], cache_dir=tmp_path, sleep=sleeps.append)
    assert llm.complete(MSGS).text == "ok"
    assert len(calls) == 3
    assert 2 in sleeps and 4 in sleeps  # exponential backoff 2s, 4s


def test_gives_up_after_max_retries(tmp_path):
    a, _ = make_provider("alpha", [FakeError(429)] * 6)
    llm = LLM([a], cache_dir=tmp_path, sleep=lambda s: None, max_retries=2)
    with pytest.raises(LLMError):
        llm.complete(MSGS)


def test_cache_prevents_second_call(tmp_path):
    a, calls = make_provider("alpha", ["first answer"])
    llm = LLM([a], cache_dir=tmp_path, sleep=lambda s: None)
    assert llm.complete(MSGS).text == "first answer"
    again = llm.complete(MSGS)
    assert again.cached and again.text == "first answer"
    assert len(calls) == 1


def test_messages_can_depend_on_provider(tmp_path):
    a, calls = make_provider("alpha", ["ok"])
    a.max_input_tokens = 1234
    llm = LLM([a], cache_dir=tmp_path, sleep=lambda s: None)
    llm.complete(lambda p: [{"role": "user", "content": str(p.max_input_tokens)}])
    assert calls[0]["messages"][0]["content"] == "1234"


def test_json_mode_falls_back_when_provider_rejects_response_format(tmp_path):
    a, calls = make_provider("alpha", [FakeError(400), '{"a": 1}'])
    llm = LLM([a], cache_dir=tmp_path, sleep=lambda s: None)
    assert extract_json(llm.complete(MSGS, json_mode=True).text) == {"a": 1}
    assert "response_format" in calls[0] and "response_format" not in calls[1]


def test_extract_json_tolerates_fences_and_chatter():
    assert extract_json('```json\n{"x": 2}\n```') == {"x": 2}
    assert extract_json('Sure! Here it is: {"y": [1, 2]} Hope that helps.') == {"y": [1, 2]}
    with pytest.raises(json.JSONDecodeError):
        extract_json("no json here")


def test_load_providers_skips_missing_keys_and_local(monkeypatch):
    cfg = {"providers": [
        {"name": "gemini", "base_url": "u", "model": "m", "api_key_env": "GEMINI_API_KEY"},
        {"name": "groq", "base_url": "u", "model": "m", "api_key_env": "GROQ_API_KEY"},
        {"name": "ollama", "base_url": "u", "model": "m", "api_key_env": ""},
    ]}
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GROQ_API_KEY", "k")
    monkeypatch.delenv("PAPERSTACK_USE_LOCAL", raising=False)
    assert [p.name for p in load_providers(cfg)] == ["groq"]
    assert [p.name for p in load_providers(cfg, only="ollama")] == ["ollama"]
    monkeypatch.setenv("PAPERSTACK_USE_LOCAL", "1")
    assert [p.name for p in load_providers(cfg)] == ["groq", "ollama"]
    monkeypatch.delenv("GROQ_API_KEY")
    monkeypatch.delenv("PAPERSTACK_USE_LOCAL")
    assert load_providers(cfg) == []
