#!/usr/bin/env python3
"""Write the next curriculum articles with a free LLM, behind a quality gate.

The queue is content/curriculum/<subject>.json: only entries with status "planned"
whose prerequisites are already written are picked, by priority then path order,
with a per-subject mix from pipeline/config.yaml (`daily_mix`). No paper search is
needed: ML entries carry their arXiv id.

Three passes per article:
  1. draft   - from the curriculum brief, the subject prompt and an exemplar article
  2. critic  - scores the draft against the rubric and lists concrete problems
  3. revise  - fixes those problems and any validator / C++ compile errors
A final critic score below `quality_threshold`, a validation error, or a C++ block
that does not compile means the article is NOT published: the draft is saved to
pipeline/drafts/<id>.md and the entry becomes "needs_review".

Usage:
    python pipeline/curriculum_generate.py                 # daily_mix from config
    python pipeline/curriculum_generate.py --subject dsa --count 1
    python pipeline/curriculum_generate.py --id dsa-two-pointers --dry-run
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "tools"))
import build_index as bi  # noqa: E402
from check_cpp import compile_block  # noqa: E402
from generate_article import autofix_body, render  # noqa: E402
from llm import LLM, LLMError, Provider, extract_json, load_providers  # noqa: E402
from log import log_event  # noqa: E402

PROMPTS = HERE / "prompts"
DRAFTS = HERE / "drafts"
CONFIG = HERE / "config.yaml"
PRIO = {"P0": 0, "P1": 1, "P2": 2}
FIELD_ORDER = [
    "id", "kind", "subject", "slug", "title", "subtitle", "track", "track_order", "priority", "prerequisites",
    "difficulty", "read_minutes", "topics", "complexity", "practice_problems", "paper_title", "authors", "year",
    "venue", "paper_url", "glossary", "quiz", "cover_seed", "generated_by", "generated_at", "importance_score",
]
RUBRIC = ["hook", "analogy", "intuition_first", "structure", "diagrams", "callouts", "glossary", "quiz", "accuracy", "length", "no_filler"]


class GateFailed(Exception):
    def __init__(self, reason: str, draft: str):
        super().__init__(reason)
        self.reason = reason
        self.draft = draft


# ---------------------------------------------------------------- queue

def load_config(path: Path = CONFIG) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def curriculum_path(subject: str, content: Path = bi.CONTENT) -> Path:
    return content / "curriculum" / f"{subject}.json"


def load_curriculum(subject: str, content: Path = bi.CONTENT) -> dict:
    return json.loads(curriculum_path(subject, content).read_text(encoding="utf-8"))


def save_curriculum(cur: dict, content: Path = bi.CONTENT) -> None:
    curriculum_path(cur["subject"], content).write_text(json.dumps(cur, indent=1, ensure_ascii=False), encoding="utf-8")


def existing_articles(content: Path = bi.CONTENT) -> dict[str, dict]:
    out = {}
    for p in bi.article_files(content):
        try:
            data, _ = bi.parse_article(p.read_text(encoding="utf-8"))
            out[data["id"]] = data
        except (bi.ParseError, KeyError):
            continue
    return out


def pick_entries(cur: dict, written: set[str], track_order: dict[str, int], count: int) -> list[dict]:
    """Next planned entries whose prerequisites are written, by priority, then path order."""
    ready = [e for e in cur["entries"] if e["status"] == "planned" and all(p in written for p in e.get("prerequisites", []))]
    ready.sort(key=lambda e: (PRIO.get(e["priority"], 9), track_order.get(e["track"], 99), e["order"]))
    return ready[:count]


# ---------------------------------------------------------------- prompts

def subject_prompt(subject: str, exemplar_override: Path | None = None) -> str:
    """pipeline/prompts/<subject>.md with the shared guide, format and an exemplar article filled in."""
    tpl = (PROMPTS / f"{subject}.md").read_text(encoding="utf-8")
    m = re.search(r"^exemplar:\s*(\S+)\s*$", tpl, re.M)
    exemplar_path = exemplar_override or (ROOT / m.group(1) if m else None)
    exemplar = exemplar_path.read_text(encoding="utf-8") if exemplar_path and exemplar_path.exists() else "(no exemplar yet)"
    tpl = re.sub(r"^exemplar:.*\n", "", tpl, flags=re.M)
    return (
        tpl.replace("{{WRITING_GUIDE}}", (PROMPTS / "writing_guide.md").read_text(encoding="utf-8").strip())
        .replace("{{FORMAT}}", (PROMPTS / "format.md").read_text(encoding="utf-8").strip())
        .replace("{{EXEMPLAR}}", exemplar.strip())
    )


def entry_header(e: dict, written: dict[str, dict], today: str) -> str:
    links = "\n".join(f"- {i}: {d.get('title', '')}" for i, d in sorted(written.items()) if d.get("subject", "ml") == e["subject"] or i in e.get("prerequisites", []))
    fixed = {
        "id": e["id"], "kind": e["kind"], "subject": e["subject"], "slug": e["slug"], "track": e["track"],
        "track_order": e["order"], "priority": e["priority"],
        "prerequisites": [p for p in e.get("prerequisites", []) if p in written],
        "cover_seed": e["slug"], "generated_at": today,
    }
    if e["kind"] == "paper":
        fixed["paper_url"] = e.get("paper_url")
    return f"""## The entry to write
Working title (improve it: curiosity-driven, under 10 words): {e['title_working']}
Use these exact frontmatter values:
{json.dumps(fixed, indent=1, ensure_ascii=False)}

## Brief from the curriculum
{json.dumps(e.get('brief', {}), indent=1, ensure_ascii=False)}

## Existing article ids you may link to with [text](article:<id>) (no others)
{links}
"""


def draft_messages(e: dict, written: dict[str, dict], today: str, paper_text: str = "") -> list[dict]:
    extra = f"\n## Paper excerpt (check every fact against it)\n{paper_text}\n" if paper_text else ""
    user = entry_header(e, written, today) + extra + "\nWrite the complete article file now. Start with the line --- and end with the last takeaway bullet."
    return [{"role": "system", "content": subject_prompt(e["subject"])}, {"role": "user", "content": user}]


def critic_messages(e: dict, article: str) -> list[dict]:
    rubric = (PROMPTS / "critic.md").read_text(encoding="utf-8")
    return [
        {"role": "system", "content": rubric},
        {"role": "user", "content": f"Subject: {e['subject']}. Kind: {e['kind']}. Brief: {json.dumps(e.get('brief', {}), ensure_ascii=False)}\n\n## Article\n{article}"},
    ]


def revise_messages(e: dict, written: dict[str, dict], today: str, draft: str, problems: list[str]) -> list[dict]:
    msgs = draft_messages(e, written, today)
    msgs += [
        {"role": "assistant", "content": draft},
        {"role": "user", "content": "An editor reviewed this draft. Fix every problem below, keep everything that already works, "
         "and return the complete corrected file starting with the line ---.\n- " + "\n- ".join(problems)},
    ]
    return msgs


# ---------------------------------------------------------------- finalising + gate

def finalize(raw: str, e: dict, written: dict[str, dict], generated_by: str, today: str) -> tuple[dict, str]:
    data, body = bi.parse_article(raw)
    data.update(
        id=e["id"], kind=e["kind"], subject=e["subject"], slug=e["slug"], track=e["track"], track_order=e["order"],
        priority=e["priority"], cover_seed=e["slug"], generated_by=generated_by, generated_at=today,
        prerequisites=[p for p in (data.get("prerequisites") or []) if isinstance(p, str) and p in written][:4],
    )
    if e["subject"] == "ml":
        data.pop("priority", None)
    if e["kind"] == "paper" and e.get("paper_url"):
        data["paper_url"] = e["paper_url"]
    if not isinstance(data.get("importance_score"), (int, float)):
        data["importance_score"] = {"P0": 0.9, "P1": 0.75, "P2": 0.6}.get(e["priority"], 0.6)
    if data.get("difficulty") not in bi.DIFFICULTIES:
        data["difficulty"] = "intermediate"
    if not isinstance(data.get("topics"), list) or not data["topics"]:
        data["topics"] = [e["track"]]
    body = autofix_body(body, data.get("glossary") or [], set(written) | {e["id"]})
    data["read_minutes"] = bi.read_minutes(bi.word_count(body))
    ordered = {k: data[k] for k in FIELD_ORDER if k in data}
    return ordered, body


def gate_errors(data: dict, body: str, tracks: list[str], written: set[str]) -> list[str]:
    errors, warnings = bi.validate_article(data, body, tracks, written | {data["id"]})
    out = [x.message for x in errors] + [x.message for x in warnings if x.code.startswith("length")]
    for i, (info, code) in enumerate(bi.cpp_blocks(body), 1):
        if "partial" in info.split():
            continue
        err = compile_block(code)
        if err:
            out.append(f"C++ block {i} does not compile (g++ -std=c++17). First error: {err.strip().splitlines()[0][:300]}")
    return out


def critique(llm: LLM, e: dict, article: str) -> tuple[float, list[str]]:
    resp = llm.complete(critic_messages(e, article), temperature=0.1, json_mode=True)
    data = extract_json(resp.text)
    scores = data.get("scores") or {}
    vals = [float(scores[k]) for k in RUBRIC if isinstance(scores.get(k), (int, float))]
    overall = float(data.get("overall", sum(vals) / len(vals) if vals else 0))
    problems = [str(p) for p in data.get("problems") or []][:15]
    return overall, problems


def generate_entry(e: dict, llm: LLM, config: dict, written: dict[str, dict], tracks: list[str], today: str, paper_text: str = "") -> tuple[dict, str, float]:
    threshold = float(config.get("quality_threshold", 7.5))
    draft = llm.complete(draft_messages(e, written, today, paper_text), temperature=0.6)
    raw = draft.text
    score, problems = critique(llm, e, raw)
    log_event("critic", id=e["id"], pass_="draft", score=score, problems=len(problems))
    try:
        data, body = finalize(raw, e, written, draft.generated_by, today)
        problems += gate_errors(data, body, tracks, set(written))
    except bi.ParseError as err:
        problems.append(err.message)

    revised = llm.complete(revise_messages(e, written, today, raw, problems or ["Tighten anything that is vague."]), temperature=0.4)
    raw = revised.text
    try:
        data, body = finalize(raw, e, written, revised.generated_by, today)
    except bi.ParseError as err:
        raise GateFailed(f"revised file does not parse: {err.message}", raw) from err
    errs = gate_errors(data, body, tracks, set(written))
    if errs:
        raise GateFailed("validator or compile errors: " + "; ".join(errs[:5]), render(data, body))
    final, final_problems = critique(llm, e, render(data, body))
    log_event("critic", id=e["id"], pass_="final", score=final, problems=len(final_problems))
    if final < threshold:
        raise GateFailed(f"quality score {final:.1f} below threshold {threshold}: " + "; ".join(final_problems[:5]), render(data, body))
    return data, body, final


def ml_paper_text(e: dict, config: dict) -> str:
    if e.get("kind") != "paper" or not e.get("arxiv_id"):
        return ""
    try:
        from extract_text import extract

        return extract(e["arxiv_id"], None, int(config.get("max_input_tokens", 30000)))[:60000]
    except Exception as err:  # noqa: BLE001 - the brief alone is still usable
        log_event("paper_text_failed", id=e["id"], error=str(err)[:200])
        return ""


# ---------------------------------------------------------------- main

def run(args: argparse.Namespace, content: Path = bi.CONTENT) -> int:
    config = load_config()
    providers = load_providers(config, only=args.provider)
    if not providers:
        print("No LLM provider available (set GEMINI_API_KEY or GROQ_API_KEY, or use --provider ollama). Nothing to do.")
        log_event("no_providers")
        return 0
    llm = LLM(providers)
    today = dt.date.today().isoformat()
    tracks = bi.load_tracks(content)
    track_ids = [t["id"] for t in tracks]
    track_order = {t["id"]: t["order"] for t in tracks}
    written = existing_articles(content)

    mix: dict[str, int] = dict(config.get("daily_mix") or {})
    if args.id:
        mix = {p.stem: 1 for p in sorted((content / "curriculum").glob("*.json"))}
    elif args.subject:
        mix = {args.subject: args.count or 1}
    elif args.count is not None:
        mix = {k: min(v, args.count) for k, v in mix.items()}

    jobs: list[tuple[dict, dict]] = []
    for subject, n in mix.items():
        if n <= 0 or not curriculum_path(subject, content).exists():
            continue
        cur = load_curriculum(subject, content)
        if cur.get("status") == "planned":  # whole subject not started yet (CS Core)
            continue
        if args.id:
            picked = [x for x in cur["entries"] if x["id"] == args.id and x["status"] != "written"]
        else:
            picked = pick_entries(cur, set(written), track_order, n)
        jobs += [(cur, x) for x in picked]

    ok, failed = [], []
    for cur, e in jobs:
        log_event("entry_start", id=e["id"], subject=e["subject"])
        try:
            data, body, score = generate_entry(e, llm, config, written, track_ids, today, ml_paper_text(e, config))
        except GateFailed as gf:
            failed.append(e["id"])
            log_event("entry_rejected", id=e["id"], reason=gf.reason[:500])
            if not args.dry_run:
                DRAFTS.mkdir(exist_ok=True)
                (DRAFTS / f"{e['id']}.md").write_text(f"<!-- Rejected {today}: {gf.reason[:800]} -->\n\n{gf.draft}", encoding="utf-8")
                e["status"], e["written_by"] = "needs_review", "pipeline-draft"
                save_curriculum(cur, content)
            continue
        except (LLMError, ValueError, json.JSONDecodeError) as err:
            failed.append(e["id"])
            log_event("entry_failed", id=e["id"], error=str(err)[:500])
            continue

        folder = bi.expected_folder(data)
        path = content / folder / f"{data['slug']}.md"
        if args.dry_run:
            print(render(data, body))
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(render(data, body), encoding="utf-8")
        written[data["id"]] = data
        e["status"], e["written_by"] = "written", data["generated_by"]
        save_curriculum(cur, content)
        ok.append(e["id"])
        log_event("entry_written", id=e["id"], score=score, path=str(path.relative_to(content.parent)))

    log_event("run_done", written=ok, rejected=failed)
    print(f"Wrote {len(ok)}: {', '.join(ok) or 'none'}. Rejected or failed {len(failed)}: {', '.join(failed) or 'none'}.")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--subject", help="only this subject")
    ap.add_argument("--count", type=int, default=None, help="max entries per subject")
    ap.add_argument("--id", help="write this curriculum entry")
    ap.add_argument("--provider", help="only this provider (gemini, groq, ollama)")
    ap.add_argument("--dry-run", action="store_true")
    sys.exit(run(ap.parse_args()))


if __name__ == "__main__":
    main()
