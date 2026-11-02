#!/usr/bin/env python3
"""Heuristic rubric score for articles (0-10 per criterion), used to triage reviews.

It cannot judge factual accuracy or real engagement; a human or Claude review does that.
It flags structural weaknesses: missing callouts, no reused analogy, maths before intuition,
filler phrases, weak glossary use, length outside the target.

Usage: python tools/review_score.py [--generated-by gemini] [files...]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
import build_index as bi  # noqa: E402

FILLER = [
    "delve", "it is important to note", "in conclusion", "crucial", "pivotal", "landscape", "tapestry",
    "groundbreaking", "revolutionary", "moreover", "furthermore", "in this article", "this paper proposes",
    "game-changer", "paradigm shift", "seamless", "leverage", "robust", "cutting-edge", "realm",
]


def section(body: str, name: str) -> str:
    m = re.search(rf"^## {re.escape(name)}\s*$([\s\S]*?)(?=^## |\Z)", body, re.M)
    return m.group(1) if m else ""


def score(data: dict, body: str) -> dict[str, float]:
    kind = data.get("kind", "paper")
    low = body.lower()
    s: dict[str, float] = {}
    hook = section(body, "The hook").strip()
    sentences = len(re.findall(r"[.!?](\s|$)", hook))
    bad_open = re.match(r"(this paper|in this article|the paper)", hook.lower()) is not None
    s["hook"] = 0 if not hook else max(0, 10 - (4 if bad_open else 0) - (3 if sentences > 7 else 0) - (2 if sentences < 2 else 0))
    analogy = re.findall(r"^:::analogy\n([\s\S]*?)^:::", body, re.M)
    if analogy:
        words = {w for w in re.findall(r"[a-z]{5,}", analogy[0].lower())} - {"think", "imagine", "picture", "about", "which", "their", "there", "where"}
        rest = low.split(":::analogy", 1)[1]
        rest = rest.split(":::", 2)[-1]
        reused = sum(1 for w in words if rest.count(w) >= 1)
        s["analogy"] = min(10, 5 + reused)
    else:
        s["analogy"] = 0
    first_math = low.find("$$")
    first_callout = min([i for i in (low.find(":::analogy"), low.find(":::insight")) if i >= 0] or [len(low)])
    s["intuition_first"] = 10 if first_math < 0 or first_callout < first_math else 4
    errors, warnings = bi.validate_article(data, body, [data.get("track")], None)
    s["structure"] = 10 if not [e for e in errors if e.code == "sections"] else 0
    paras = [p for p in re.split(r"\n\s*\n", bi.strip_fences(body)) if p.strip() and not p.lstrip().startswith(("|", "-", ":::", "#", "$$", "!"))]
    long_paras = sum(1 for p in paras if len(re.findall(r"[.!?](\s|$)", p)) > 5)
    s["structure"] = max(0, s["structure"] - 2 * long_paras)
    mer = len(re.findall(r"^```mermaid", body, re.M))
    s["diagrams"] = 10 if 1 <= mer <= 3 else (5 if mer > 3 else (6 if kind not in bi.NEEDS_MERMAID else 0))
    c = {d: len(re.findall(rf"^:::{d}\b", body, re.M)) for d in bi.DIRECTIVES}
    s["callouts"] = min(10, (3 if c["insight"] else 0) + (3 if c["try-this"] else 0) + (2 if c["warning"] else 0) + (2 if c["history"] or kind != "paper" else 0))
    gl = data.get("glossary") or []
    refs = len(set(bi.normalize_term(r) for r in bi.glossary_refs(body)))
    s["glossary"] = min(10, (5 if 3 <= len(gl) <= 8 else 0) + refs)
    s["quiz"] = 10 if len(data.get("quiz") or []) == 3 else 0
    words = bi.word_count(body)
    lo, hi = bi.WORD_LIMITS.get(kind, (1000, 2200))
    s["length"] = 10 if lo <= words <= hi else max(0, 10 - abs(words - (lo if words < lo else hi)) // 50)
    filler = sum(low.count(f) for f in FILLER)
    s["no_filler"] = max(0, 10 - 2 * filler)
    s["overall"] = round(sum(s.values()) / len(s), 1)
    return s


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--generated-by", default=None, help="only articles whose generated_by starts with this")
    ap.add_argument("files", nargs="*")
    a = ap.parse_args()
    files = [Path(f) for f in a.files] or bi.article_files()
    rows = []
    for p in files:
        data, body = bi.parse_article(p.read_text(encoding="utf-8"))
        if a.generated_by and not str(data.get("generated_by", "")).startswith(a.generated_by):
            continue
        rows.append((data["id"], score(data, body)))
    keys = list(rows[0][1]) if rows else []
    print("id\t" + "\t".join(keys))
    for i, s in sorted(rows, key=lambda r: r[1]["overall"]):
        print(i + "\t" + "\t".join(str(s[k]) for k in keys))
    if rows:
        print(f"mean overall: {sum(s['overall'] for _, s in rows) / len(rows):.2f} over {len(rows)} articles")
    return 0


if __name__ == "__main__":
    sys.exit(main())
