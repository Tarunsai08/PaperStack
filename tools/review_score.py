#!/usr/bin/env python3
"""Heuristic rubric score for articles (0-10 per criterion), used to triage reviews.

It cannot judge factual accuracy or real engagement; a human or Claude read does that.
It flags weaknesses so the weakest articles get rewritten first.

Criteria (owner's rules 2.1 and 2.2, 2026-11-03):
- Structure: hook, analogy, intuition_first, structure, diagrams, callouts, glossary, quiz.
- Engagement: curiosity_loops, predict_reveal, voice, variety, momentum.
- Completeness (replaces word counts): traced example, edge cases and mistakes, variants,
  complexity or trade-offs, interview follow-ups, connections to other articles.
- no_filler: banned phrases and repeated paragraphs.

There is no length criterion, and no check rewards length: every count saturates at a small
number, and every rate is per word. Shorter is not worse. An article that explains the concept
correctly and completely is good at any length; one that does not is not good at any length.
This score only orders the reading queue; an editorial read decides whether to rewrite.

Usage:
  python tools/review_score.py [--generated-by gemini] [--below 8.5] [--markdown] [files...]
"""
from __future__ import annotations

import argparse
import re
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
import build_index as bi  # noqa: E402

FILLER = [
    "delve", "it is important to note", "in conclusion", "pivotal", "tapestry", "groundbreaking",
    "moreover", "furthermore", "in this article", "this paper proposes", "game-changer", "paradigm shift",
    "seamless", "cutting-edge", "let's dive in",
]
LOOP_CUES = [
    r"we'll see why", r"we will see why", r"in a minute", r"in a moment", r"hold that thought", r"come back to",
    r"later in this", r"spoiler", r"here's the catch", r"here is the catch", r"there's a catch", r"there is a catch",
    r"the twist", r"plot twist", r"surprise", r"remember the", r"back to the", r"wait,? why", r"but why",
]
PREDICT_CUES = [
    r"\bguess\b", r"\bpredict", r"before (you )?(read|scroll|look)", r"pause (here|and)", r"what do you think",
    r"\btake a guess", r"try it (yourself|first)", r"what would you", r"which (one|of these)", r"can you spot",
    r"stop and think", r"make a bet",
]
ENGAGEMENT = ["curiosity_loops", "predict_reveal", "voice", "variety", "momentum"]


def section(body: str, name: str) -> str:
    m = re.search(rf"^## {re.escape(name)}\s*$([\s\S]*?)(?=^## |\Z)", body, re.M)
    return m.group(1) if m else ""


def prose_paragraphs(body: str) -> list[str]:
    out = []
    for p in re.split(r"\n\s*\n", bi.strip_fences(body)):
        s = p.strip()
        if s and not s.startswith(("|", "-", "*", ":::", "#", "$$", "!", ">")) and not re.match(r"\d+\.", s):
            out.append(s)
    return out


def cues(text: str, pats: list[str]) -> int:
    return sum(len(re.findall(p, text)) for p in pats)


def score(data: dict, body: str) -> dict[str, float]:
    kind = data.get("kind", "paper")
    low = bi.strip_fences(body).lower().replace("’", "'")
    words = max(1, bi.word_count(body))
    s: dict[str, float] = {}

    # --- Structure ---
    hook = section(body, "The hook").strip()
    sentences = len(re.findall(r"[.!?](\s|$)", hook))
    bad_open = re.match(r"(this paper|in this article|the paper|today we)", hook.lower()) is not None
    definition_open = re.match(r"^[A-Z][\w\s'-]{0,40} (is|are) (a|an|the) ", hook) is not None
    s["hook"] = 0 if not hook else max(0, 10 - (4 if bad_open else 0) - (3 if definition_open else 0)
                                       - (2 if sentences > 12 else 0) - (2 if sentences < 2 else 0))
    analogy = re.findall(r"^:::analogy\n([\s\S]*?)^:::", body, re.M)
    if analogy:
        vocab = {w for w in re.findall(r"[a-z]{5,}", analogy[0].lower())} - {
            "think", "imagine", "picture", "about", "which", "their", "there", "where", "would", "every", "never"}
        rest = low.split(":::analogy", 1)[1].split(":::", 2)[-1]
        reused = sum(1 for w in vocab if w in rest)
        s["analogy"] = min(10, 5 + reused)
    else:
        s["analogy"] = 0
    first_math = low.find("$$")
    first_callout = min([i for i in (low.find(":::analogy"), low.find(":::insight")) if i >= 0] or [len(low)])
    s["intuition_first"] = 10 if first_math < 0 or first_callout < first_math else 4
    errors, warnings = bi.validate_article(data, body, [data.get("track")], None)
    s["structure"] = 10 if not [e for e in errors if e.code == "sections"] else 0
    paras = prose_paragraphs(body)
    long_paras = sum(1 for p in paras if len(re.findall(r"[.!?](\s|$)", p)) > 5)
    s["structure"] = max(0, s["structure"] - 2 * long_paras)
    mer = len(re.findall(r"^```mermaid", body, re.M))
    s["diagrams"] = 10 if mer >= 1 else (6 if kind not in bi.NEEDS_MERMAID else 0)
    c = {d: len(re.findall(rf"^:::{d}\b", body, re.M)) for d in bi.DIRECTIVES}
    s["callouts"] = min(10, (3 if c["insight"] else 0) + (3 if c["try-this"] else 0) + (2 if c["warning"] else 0)
                        + (2 if c["history"] or kind != "paper" else 0))
    gl = data.get("glossary") or []
    refs = len(set(bi.normalize_term(r) for r in bi.glossary_refs(body)))
    s["glossary"] = min(10, (5 if 3 <= len(gl) <= 8 else 0) + refs)
    s["quiz"] = 10 if len(data.get("quiz") or []) == 3 else 0

    # --- Engagement ---
    loops = cues(low, LOOP_CUES)
    s["curiosity_loops"] = min(10, 4 + 3 * loops)  # saturates at 2 loops: length earns nothing
    after_hook = low.split("## the hook", 1)[-1]
    questions = len(re.findall(r"\?(\s|$|\))", after_hook))
    predicts = cues(low, PREDICT_CUES)
    s["predict_reveal"] = min(10, 4 + 3 * predicts + min(2, questions))  # saturates fast
    you_rate = len(re.findall(r"\byou(r|'re|'ll|'d|'ve)?\b", low)) * 100 / words
    lens = [len(p.split()) for p in paras] or [0]
    short = sum(1 for n in lens if n <= 25) / len(lens)
    spread = statistics.pstdev(lens) if len(lens) > 1 else 0
    s["voice"] = min(10, round(min(5, you_rate * 2.5) + (3 if 0.15 <= short <= 0.75 else 1) + (2 if spread >= 12 else 1)))
    visuals = (len(re.findall(r"^```", body, re.M)) // 2 + sum(c.values()) + len(re.findall(r"^\|[- :|]+\|\s*$", body, re.M))
               + len(re.findall(r"^#{3}\s", body, re.M)))
    per300 = visuals * 300 / words
    s["variety"] = min(10, round(per300 * 6))
    h3 = len(re.findall(r"^###\s", body, re.M))
    ending = (section(body, "Key takeaways") + section(body, "What happened next") + section(body, "Further reading")
              + section(body, "Where to go next") + body[-1500:])
    next_hook = "](article:" in ending
    # Sub-headings only matter for navigation in long articles; a short article needs none.
    nav = 3 if words < 1500 else min(3, h3)
    s["momentum"] = min(10, (5 if next_hook else 0) + nav + (2 if loops + predicts >= 2 else 0))

    # --- Completeness ---
    checks = [
        bool(re.search(r"^\|.*\|\s*$\n^\|[- :|]+\|\s*$(\n^\|.*\|\s*$){3,}", body, re.M)),   # traced table
        bool(re.search(r"edge case|corner case|empty|overflow|what breaks|fails when|failure", low)),
        bool(re.search(r"mistake|pitfall|bug|misconception|trap", low)),
        bool(re.search(r"variant|variation|twist|generali[sz]|extension|instead of", low)),
        bool(re.search(r"o\(|complexity|trade-?off|cost|latency|throughput", low)),
        bool(re.search(r"interview|follow-?up|asked", low)),
        "](article:" in body,
    ]
    s["completeness"] = round(10 * sum(checks) / len(checks), 1)

    filler = sum(len(re.findall(rf"\b{re.escape(f)}\b", low)) for f in FILLER)
    s["no_filler"] = max(0, 10 - 2 * filler - 3 * len(bi.repeated_paragraphs(body)))
    s["engagement"] = round(sum(s[k] for k in ENGAGEMENT) / len(ENGAGEMENT), 1)
    s["overall"] = round(sum(v for k, v in s.items() if k != "engagement") / (len(s) - 1), 1)
    s["words"] = words
    return s


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--generated-by", default=None, help="only articles whose generated_by starts with this")
    ap.add_argument("--subject", default=None)
    ap.add_argument("--below", type=float, default=None, help="only articles whose overall is below this")
    ap.add_argument("--markdown", action="store_true", help="print a Markdown table (for REVIEW_LOG.md)")
    ap.add_argument("files", nargs="*")
    a = ap.parse_args()
    files = [Path(f) for f in a.files] or bi.article_files()
    rows = []
    for p in files:
        data, body = bi.parse_article(p.read_text(encoding="utf-8"))
        if a.generated_by and not str(data.get("generated_by", "")).startswith(a.generated_by):
            continue
        if a.subject and data.get("subject", "ml") != a.subject:
            continue
        sc = score(data, body)
        if a.below is not None and sc["overall"] >= a.below:
            continue
        rows.append((data["id"], data.get("subject", "ml"), sc))
    rows.sort(key=lambda r: (r[2]["overall"], r[2]["engagement"]))
    if a.markdown:
        print("| Article | Subject | Words | Engagement | Completeness | Overall | Status |")
        print("|---|---|---|---|---|---|---|")
        for i, subj, s in rows:
            print(f"| `{i}` | {subj} | {s['words']} | {s['engagement']} | {s['completeness']} | {s['overall']} | pending |")
        return 0
    keys = list(rows[0][2]) if rows else []
    print("id\t" + "\t".join(keys))
    for i, _, s in rows:
        print(i + "\t" + "\t".join(str(s[k]) for k in keys))
    if rows:
        print(f"mean overall: {sum(s['overall'] for *_, s in rows) / len(rows):.2f}, "
              f"mean engagement: {sum(s['engagement'] for *_, s in rows) / len(rows):.2f} over {len(rows)} articles")
    return 0


if __name__ == "__main__":
    sys.exit(main())
