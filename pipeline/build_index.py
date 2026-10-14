#!/usr/bin/env python3
"""Validate every article in content/ and write content/index.json.

These rules mirror app/src/lib/frontmatter.ts. Both are tested against the
shared fixtures in tests/fixtures (see cases.json).

Usage:
    python pipeline/build_index.py            # validate + write index (CI)
    python pipeline/build_index.py --strict   # also fail on warnings (length, title)
    python pipeline/build_index.py --partial  # unresolved cross references are warnings
    python pipeline/build_index.py --check    # validate only, do not write
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any, Iterable

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"

PAPER_SECTIONS = [
    "The hook",
    "Before you start",
    "The world before this paper",
    "The big idea",
    "How it works",
    "What they found",
    "What it got wrong (or left open)",
    "What happened next",
    "Key takeaways",
]
PRIMER_SECTIONS = [
    "The hook",
    "The intuition",
    "Let's build it up",
    "A tiny example",
    "Where you'll see this again",
    "Key takeaways",
]
DIRECTIVES = ["insight", "analogy", "history", "warning", "try-this"]
DIFFICULTIES = ["beginner", "intermediate", "advanced"]
KINDS = ["paper", "primer"]
WORD_LIMITS = {"paper": (1400, 2200), "primer": (1000, 1600)}
WORDS_PER_MINUTE = 220

FM_RE = re.compile(r"^\ufeff?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)")
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
FENCE_RE = re.compile(r"^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$", re.M)
WORD_RE = re.compile(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*")
GLOSS_RE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")


class ParseError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class Issue(dict):
    def __init__(self, code: str, message: str):
        super().__init__(code=code, message=message)

    @property
    def code(self) -> str:
        return self["code"]

    @property
    def message(self) -> str:
        return self["message"]


def _normalize_yaml(v: Any) -> Any:
    """PyYAML (YAML 1.1) turns unquoted dates into date objects; the app sees strings."""
    if isinstance(v, (_dt.date, _dt.datetime)):
        return v.isoformat()[:10]
    if isinstance(v, dict):
        return {k: _normalize_yaml(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_normalize_yaml(x) for x in v]
    return v


def parse_article(raw: str) -> tuple[dict, str]:
    text = re.sub(r"^\s*```(?:markdown|md)?\s*\n(?=---)", "", raw)
    text = re.sub(r"\n```\s*$", "\n", text)
    text = text.lstrip()
    m = FM_RE.match(text)
    if not m:
        raise ParseError(
            "frontmatter_missing",
            "The file must start with a YAML frontmatter block between two lines of three dashes (---).",
        )
    try:
        data = yaml.safe_load(m.group(1))
    except yaml.YAMLError as e:
        first = str(e).split("\n")[0]
        raise ParseError("yaml_invalid", f"The frontmatter is not valid YAML: {first}") from e
    if not isinstance(data, dict):
        raise ParseError("yaml_invalid", "The frontmatter must be a YAML mapping of fields.")
    return _normalize_yaml(data), text[m.end():]


def strip_fences(md: str) -> str:
    return FENCE_RE.sub("", md)


def extract_h2(body: str) -> list[str]:
    out = []
    for line in strip_fences(body).splitlines():
        if re.match(r"^##\s+", line) and not line.startswith("###"):
            out.append(re.sub(r"^##\s+", "", line).strip())
    return out


def has_mermaid(body: str) -> bool:
    return re.search(r"^```mermaid[ \t]*$", body, re.M) is not None


def plain_text(body: str) -> str:
    t = strip_fences(body)
    t = re.sub(r"\$\$[\s\S]*?\$\$", " ", t)
    t = re.sub(r"^:::.*$", " ", t, flags=re.M)
    t = re.sub(r"^#{1,6}\s+", "", t, flags=re.M)
    t = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = GLOSS_RE.sub(lambda m: m.group(2) or m.group(1), t)
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"\$([^$\n]+)\$", r"\1", t)
    t = re.sub(r"[*_`>|]", "", t)
    t = re.sub(r"^\s*[-+]\s+", "", t, flags=re.M)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def word_count(body: str) -> int:
    return len(WORD_RE.findall(plain_text(body)))


def read_minutes(words: int) -> int:
    # JS Math.round rounds .5 up; Python's round() is banker's rounding.
    return max(1, int(words / WORDS_PER_MINUTE + 0.5))


def excerpt(body: str, length: int = 300) -> str:
    t = re.sub(r"^The hook\s+", "", plain_text(body))
    if len(t) <= length:
        return t
    cut = t[:length]
    sp = cut.rfind(" ")
    return cut[: sp if sp > 200 else length].rstrip() + "…"


def glossary_refs(body: str) -> list[str]:
    return [m.group(1).strip() for m in GLOSS_RE.finditer(strip_fences(body))]


def article_links(body: str) -> list[str]:
    return re.findall(r"\]\(article:([a-z0-9-]+)\)", strip_fences(body))


def directive_names(body: str) -> list[str]:
    return re.findall(r"^:::([A-Za-z][\w-]*)", strip_fences(body), flags=re.M)


def normalize_term(t: str) -> str:
    s = re.sub(r"\s+", " ", t.strip().lower())
    if s.endswith("ies") and len(s) > 4:
        return s[:-3] + "y"
    if s.endswith("es") and re.search(r"(s|x|ch|sh)es$", s):
        return s[:-2]
    if s.endswith("s") and not s.endswith("ss") and len(s) > 3:
        return s[:-1]
    return s


def _is_str(v: Any) -> bool:
    return isinstance(v, str) and v.strip() != ""


def _is_int(v: Any) -> bool:
    return isinstance(v, int) and not isinstance(v, bool)


def _is_num(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _is_str_list(v: Any) -> bool:
    return isinstance(v, list) and all(_is_str(x) for x in v)


def validate_article(
    data: dict,
    body: str,
    track_ids: Iterable[str],
    article_ids: Iterable[str] | None = None,
) -> tuple[list[Issue], list[Issue]]:
    errors: list[Issue] = []
    warnings: list[Issue] = []

    def err(code: str, msg: str) -> None:
        errors.append(Issue(code, msg))

    def warn(code: str, msg: str) -> None:
        warnings.append(Issue(code, msg))

    required = {
        "id": _is_str,
        "kind": _is_str,
        "slug": _is_str,
        "title": _is_str,
        "subtitle": _is_str,
        "track": _is_str,
        "track_order": _is_int,
        "prerequisites": lambda v: isinstance(v, list) and all(_is_str(x) for x in v),
        "difficulty": _is_str,
        "read_minutes": _is_int,
        "topics": lambda v: _is_str_list(v) and len(v) > 0,
        "glossary": lambda v: isinstance(v, list),
        "quiz": lambda v: isinstance(v, list),
        "cover_seed": _is_str,
        "generated_by": _is_str,
        "generated_at": _is_str,
        "importance_score": _is_num,
    }
    paper_required = {
        "paper_title": _is_str,
        "authors": lambda v: _is_str_list(v) and len(v) > 0,
        "year": _is_int,
        "venue": _is_str,
        "paper_url": _is_str,
    }

    def check(fields: dict) -> None:
        for field, ok in fields.items():
            v = data.get(field)
            if v is None or v == "":
                err("field_missing", f'Missing required field "{field}".')
            elif not ok(v):
                err("field_type", f'Field "{field}" has the wrong type or is empty.')

    check(required)
    kind = data.get("kind")
    if _is_str(kind) and kind not in KINDS:
        err("kind_invalid", f'"kind" must be "paper" or "primer", not "{kind}".')
    if kind == "paper":
        check(paper_required)

    aid = data.get("id")
    if _is_str(aid):
        if not ID_RE.match(aid):
            err("id_format", f'"id" must be lowercase words joined by dashes, got "{aid}".')
        elif _is_str(kind) and not aid.startswith(f"{kind}-"):
            err("id_format", f'"id" must start with "{kind}-".')
    if _is_str(data.get("slug")) and not ID_RE.match(data["slug"]):
        err("id_format", '"slug" must be lowercase words joined by dashes.')

    if _is_str(data.get("difficulty")) and data["difficulty"] not in DIFFICULTIES:
        err("difficulty_invalid", '"difficulty" must be beginner, intermediate or advanced.')

    track_ids = set(track_ids)
    if _is_str(data.get("track")) and data["track"] not in track_ids:
        err("track_unknown", f'Unknown track "{data["track"]}". Use one of: {", ".join(track_ids)}.')
    if _is_int(data.get("track_order")) and data["track_order"] < 1:
        err("field_type", '"track_order" must be 1 or more.')
    rm = data.get("read_minutes")
    if _is_int(rm) and (rm < 1 or rm > 60):
        err("field_type", '"read_minutes" must be between 1 and 60.')

    if _is_str(data.get("generated_at")) and not DATE_RE.match(data["generated_at"]):
        err("date_format", '"generated_at" must look like 2026-10-14 (put it in quotes).')
    imp = data.get("importance_score")
    if _is_num(imp) and (imp < 0 or imp > 1):
        err("importance_range", '"importance_score" must be between 0 and 1.')
    if kind == "paper" and _is_str(data.get("paper_url")) and not re.match(r"^https?://\S+$", data["paper_url"]):
        err("paper_url", '"paper_url" must be a full http(s) link.')
    if kind == "paper" and _is_int(data.get("year")) and not (1900 <= data["year"] <= 2100):
        err("field_type", '"year" looks wrong.')

    glossary = data.get("glossary") if isinstance(data.get("glossary"), list) else []
    if isinstance(data.get("glossary"), list) and not (3 <= len(glossary) <= 8):
        err("glossary_count", f"The glossary needs 3 to 8 terms (found {len(glossary)}).")
    for i, g in enumerate(glossary):
        if not isinstance(g, dict) or not _is_str(g.get("term")) or not _is_str(g.get("definition")):
            err("glossary_item", f'Glossary item {i + 1} needs a "term" and a "definition".')

    quiz = data.get("quiz") if isinstance(data.get("quiz"), list) else []
    if isinstance(data.get("quiz"), list) and len(quiz) != 3:
        err("quiz_count", f"The quiz needs exactly 3 questions (found {len(quiz)}).")
    for i, q in enumerate(quiz):
        if not isinstance(q, dict) or not _is_str(q.get("q")) or not _is_str(q.get("explain")):
            err("quiz_item", f'Quiz question {i + 1} needs "q" and "explain" text.')
            continue
        opts = q.get("options")
        if not isinstance(opts, list) or len(opts) != 4 or not all(_is_str(o) for o in opts):
            err("quiz_options", f"Quiz question {i + 1} needs exactly 4 text options.")
        ans = q.get("answer")
        if not _is_int(ans) or ans < 0 or ans > 3:
            err("quiz_answer", f'Quiz question {i + 1} needs "answer" as a number from 0 to 3.')

    if kind in KINDS:
        expected = PAPER_SECTIONS if kind == "paper" else PRIMER_SECTIONS
        found = extract_h2(body)
        if found != expected:
            missing = [h for h in expected if h not in found]
            extra = [h for h in found if h not in expected]
            parts = [f'Sections must be these "## " headings in order: {" | ".join(expected)}.']
            if missing:
                parts.append(f"Missing: {', '.join(missing)}.")
            if extra:
                parts.append(f"Unexpected: {', '.join(extra)}.")
            if not missing and not extra:
                parts.append("They are out of order.")
            err("sections", " ".join(parts))
        if kind == "paper" and not has_mermaid(body):
            err("mermaid_missing", "Paper articles need at least one ```mermaid diagram.")
        words = word_count(body)
        lo, hi = WORD_LIMITS[kind]
        if words < lo:
            warn("length_short", f"Body is {words} words; aim for {lo}-{hi}.")
        if words > hi:
            warn("length_long", f"Body is {words} words; aim for {lo}-{hi}.")

    for name in directive_names(body):
        if name not in DIRECTIVES:
            err("directive_unknown", f'Unknown block ":::{name}". Use one of: {", ".join(DIRECTIVES)}.')

    terms = {normalize_term(g["term"]) for g in glossary if isinstance(g, dict) and _is_str(g.get("term"))}
    unknown_refs = list(dict.fromkeys(r for r in glossary_refs(body) if normalize_term(r) not in terms))
    if unknown_refs:
        err(
            "glossary_ref_unknown",
            f"These [[terms]] are not in the glossary: {', '.join(unknown_refs)}. "
            "Add them to the glossary or remove the brackets.",
        )

    if _is_str(data.get("title")) and len(data["title"].split()) > 12:
        warn("title_long", "Titles read best under 10 words.")

    prereqs = [p for p in data.get("prerequisites") or [] if _is_str(p)] if isinstance(data.get("prerequisites"), list) else []
    if _is_str(aid) and aid in prereqs:
        err("self_prerequisite", "An article cannot be its own prerequisite.")
    if article_ids is not None:
        ids = set(article_ids)
        unknown_pre = [p for p in prereqs if p not in ids]
        if unknown_pre:
            err("prerequisite_unknown", f"Unknown prerequisite ids: {', '.join(unknown_pre)}.")
        unknown_links = list(dict.fromkeys(l for l in article_links(body) if l not in ids))
        if unknown_links:
            err("article_link_unknown", f"Links to unknown articles: {', '.join(unknown_links)}.")

    return errors, warnings


def load_tracks(content: Path = CONTENT) -> list[dict]:
    return json.loads((content / "tracks.json").read_text(encoding="utf-8"))


def article_files(content: Path = CONTENT) -> list[Path]:
    return sorted([*content.glob("primers/*.md"), *content.glob("papers/*.md")])


CROSS_REF_CODES = {"prerequisite_unknown", "article_link_unknown"}


def build(content: Path = CONTENT, strict: bool = False, partial: bool = False, write: bool = True) -> int:
    tracks = load_tracks(content)
    track_ids = [t["id"] for t in tracks]
    parsed: list[tuple[Path, str, dict, str]] = []
    problems = 0

    for path in article_files(content):
        raw = path.read_text(encoding="utf-8")
        try:
            data, body = parse_article(raw)
        except ParseError as e:
            print(f"ERROR {path.relative_to(content)}: [{e.code}] {e.message}")
            problems += 1
            continue
        parsed.append((path, raw, data, body))

    all_ids = [d.get("id") for _, _, d, _ in parsed]
    seen: dict[str, Path] = {}
    order_seen: dict[tuple, str] = {}
    entries = []

    for path, raw, data, body in parsed:
        rel = path.relative_to(content).as_posix()
        errors, warnings = validate_article(data, body, track_ids, all_ids)
        deferred: list[Issue] = []
        if partial:
            deferred = [e for e in errors if e.code in CROSS_REF_CODES]
            errors = [e for e in errors if e.code not in CROSS_REF_CODES]
        aid = data.get("id")
        if aid in seen:
            errors.append(Issue("duplicate_id", f'Duplicate id "{aid}" (also in {seen[aid].name}).'))
        elif isinstance(aid, str):
            seen[aid] = path
        expected_dir = "papers" if data.get("kind") == "paper" else "primers"
        if path.parent.name != expected_dir:
            errors.append(Issue("wrong_folder", f"{data.get('kind')} articles belong in content/{expected_dir}/."))
        if data.get("slug") and path.stem != data.get("slug"):
            errors.append(Issue("slug_filename", f'File name must match slug "{data.get("slug")}".'))
        key = (data.get("track"), data.get("track_order"))
        if key in order_seen:
            warnings.append(Issue("track_order_duplicate", f"Same track_order as {order_seen[key]}."))
        else:
            order_seen[key] = aid

        for e in errors:
            print(f"ERROR {rel}: [{e.code}] {e.message}")
        for w in warnings:
            print(f"WARN  {rel}: [{w.code}] {w.message}")
        for d in deferred:
            print(f"LATER {rel}: [{d.code}] {d.message}")
        problems += len(errors) + (len(warnings) if strict else 0)

        if errors:
            continue
        words = word_count(body)
        entry = dict(data)
        entry.update(
            path=rel,
            hash=hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12],
            word_count=words,
            read_minutes=read_minutes(words),
            excerpt=excerpt(body),
        )
        entries.append(entry)

    track_order = {t["id"]: t["order"] for t in tracks}
    entries.sort(key=lambda e: (track_order.get(e["track"], 99), e["track_order"], e["id"]))

    version_src = json.dumps(tracks, sort_keys=True) + "".join(f"{e['id']}:{e['hash']}" for e in entries)
    index = {
        "content_version": hashlib.sha256(version_src.encode("utf-8")).hexdigest()[:16],
        # Deterministic (latest article date, not "now") so rebuilding never creates a diff.
        "generated_at": max((e["generated_at"] for e in entries), default=""),
        "count": len(entries),
        "articles": entries,
    }

    if problems:
        print(f"\n{problems} problem(s) found in {len(parsed)} article(s).")
        return 1
    if write:
        (content / "index.json").write_text(json.dumps(index, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    total_words = sum(e["word_count"] for e in entries)
    print(f"OK: {len(entries)} articles, {total_words:,} words, version {index['content_version']}")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    ap.add_argument("--partial", action="store_true", help="allow links to articles that do not exist yet")
    ap.add_argument("--check", action="store_true", help="validate only; do not write index.json")
    ap.add_argument("--content", type=Path, default=CONTENT)
    args = ap.parse_args()
    sys.exit(build(args.content, strict=args.strict, partial=args.partial, write=not args.check))


if __name__ == "__main__":
    main()
