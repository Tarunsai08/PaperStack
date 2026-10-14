#!/usr/bin/env python3
"""Generate new PaperStack articles from research papers.

Two passes per paper:
  1. Structured notes (JSON) from the paper text: problem, prior work, idea,
     method, results the paper actually states, limitations, impact, analogy,
     diagram plan, glossary, quiz, difficulty, prerequisites.
  2. The article itself, following the shared writing guide and file format.

Paper metadata (title, authors, year, venue, link) always comes from Semantic
Scholar, never from the model. Every article is validated with the same rules
as build_index.py; on failure the model gets one retry with the exact errors.

Usage:
    python pipeline/generate_article.py                    # per_day_new papers from config
    python pipeline/generate_article.py --count 1 --provider groq
    python pipeline/generate_article.py --arxiv 2106.09685 # a specific paper
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_index as bi  # noqa: E402
from extract_text import CHARS_PER_TOKEN, extract  # noqa: E402
from fetch_papers import (  # noqa: E402
    Candidate,
    S2Client,
    existing_papers,
    fetch_candidates,
    importance_score,
    load_config,
    normalize_title,
    to_candidate,
)
from llm import LLM, LLMError, Provider, extract_json, load_providers  # noqa: E402
from log import log_event  # noqa: E402

PROMPTS = Path(__file__).resolve().parent / "prompts"
FIELD_ORDER = [
    "id", "kind", "slug", "title", "subtitle", "track", "track_order", "prerequisites", "difficulty",
    "read_minutes", "topics", "paper_title", "authors", "year", "venue", "paper_url", "glossary", "quiz",
    "cover_seed", "generated_by", "generated_at", "importance_score",
]


class GenerationError(Exception):
    pass


@dataclass
class Catalog:
    tracks: list[dict]
    articles: list[dict]  # frontmatter of existing articles

    @property
    def track_ids(self) -> list[str]:
        return [t["id"] for t in self.tracks]

    @property
    def article_ids(self) -> list[str]:
        return [a["id"] for a in self.articles]

    def next_order(self, track: str) -> int:
        orders = [int(a.get("track_order", 0)) for a in self.articles if a.get("track") == track]
        return max(orders, default=0) + 1


def load_catalog(content: Path = bi.CONTENT) -> Catalog:
    arts = []
    for path in bi.article_files(content):
        try:
            data, _ = bi.parse_article(path.read_text(encoding="utf-8"))
            arts.append(data)
        except bi.ParseError:
            continue
    return Catalog(bi.load_tracks(content), arts)


def slugify(text: str, max_len: int = 60) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    s = s[:max_len].rstrip("-")
    return s or "paper"


def unique_slug(base: str, taken: set[str]) -> str:
    slug, n = base, 2
    while f"paper-{slug}" in taken:
        slug = f"{base}-{n}"
        n += 1
    return slug


def short_authors(authors: list[str], keep: int = 3) -> list[str]:
    authors = [a for a in authors if a]
    return authors if len(authors) <= keep else authors[:keep] + ["et al."]


# ---------------------------------------------------------------- prompts

def system_prompt() -> str:
    guide = (PROMPTS / "writing_guide.md").read_text(encoding="utf-8")
    fmt = (PROMPTS / "format.md").read_text(encoding="utf-8")
    return (
        "You write articles for PaperStack, an app that teaches AI and machine learning from scratch "
        "through engaging articles about landmark research papers.\n\n" + guide.strip() + "\n\n" + fmt.strip()
    )


def catalog_listing(cat: Catalog) -> str:
    tracks = "\n".join(f"- {t['id']}: {t['title']} ({t['subtitle']})" for t in cat.tracks)
    arts = "\n".join(f"- {a['id']}: {a.get('title', '')}" for a in cat.articles)
    return f"## Track ids\n{tracks}\n\n## Existing article ids (for prerequisites and article: links)\n{arts}"


def paper_header(c: Candidate) -> str:
    return (
        f"Title: {c.title}\nAuthors: {', '.join(c.authors[:12])}\nYear: {c.year}\nVenue: {c.venue}\n"
        f"Link: {c.paper_url}\nCitations: {c.citations}\n"
    )


def notes_messages(c: Candidate, paper_text: str, cat: Catalog, prov: Provider) -> list[dict]:
    budget = max(2000, prov.max_input_tokens - 2500) * CHARS_PER_TOKEN
    text = paper_text[:budget]
    user = f"""Read this research paper and return study notes as a single JSON object.

{paper_header(c)}
Abstract: {c.abstract}

Return JSON with exactly these keys:
- "problem": the problem the paper tackles, in 2-3 plain sentences
- "prior_work": what the field did before and why it was not enough
- "big_idea": the core idea in one or two sentences
- "method_steps": list of 3-7 short steps explaining how it works
- "results": list of results. Only include numbers that literally appear in the paper text below, each with a short quote showing where it came from. If unsure, describe the result in words.
- "limitations": list of what it got wrong or left open
- "impact": what happened next, only real later developments you are confident about
- "analogy": one everyday analogy that explains the core idea
- "diagram_plan": a short description of 1-2 simple flowcharts (under 10 nodes each)
- "glossary": 3-8 objects with "term" and "definition"
- "quiz": exactly 3 objects with "q", "options" (exactly 4 strings), "answer" (0-3) and "explain"
- "difficulty": "beginner", "intermediate" or "advanced"
- "prerequisites": up to 3 ids chosen ONLY from the existing article ids listed below
- "track": the best track id from the list below
- "topics": 3-5 short lowercase topic tags
- "title_ideas": 3 curiosity-driven titles under 10 words

{catalog_listing(cat)}

## Paper text
{text}
"""
    return [
        {"role": "system", "content": "You are a careful research assistant. You never invent numbers, quotes, authors or dates. Reply with JSON only."},
        {"role": "user", "content": user},
    ]


def article_messages(c: Candidate, notes: dict, paper_text: str, cat: Catalog, prov: Provider, track: str) -> list[dict]:
    budget = max(1000, prov.max_input_tokens - 6000) * CHARS_PER_TOKEN
    excerpt = paper_text[:budget]
    user = f"""Write a PaperStack paper article (kind: "paper") about this paper.

{paper_header(c)}
Use track "{track}". Use these exact values: paper_title "{c.title}", year {c.year}, paper_url "{c.paper_url}".
Choose prerequisites only from the existing article ids below. Link to other PaperStack articles with [text](article:<id>) using only those ids.

## Study notes (from the paper)
{json.dumps(notes, ensure_ascii=False, indent=1)}

{catalog_listing(cat)}

## Paper excerpt (for checking facts)
{excerpt}

Now write the complete article file. Start your reply with the line --- and end it with the last takeaway bullet."""
    return [{"role": "system", "content": system_prompt()}, {"role": "user", "content": user}]


# ---------------------------------------------------------------- finalising

def autofix_body(body: str, glossary: list[dict], ids: set[str]) -> str:
    """Repair the two most common slips: unknown article links and [[terms]] missing from the glossary."""
    body = re.sub(r"\[([^\]]+)\]\(article:([a-z0-9-]+)\)", lambda m: m.group(0) if m.group(2) in ids else m.group(1), body)
    terms = {bi.normalize_term(g["term"]) for g in glossary if isinstance(g, dict) and isinstance(g.get("term"), str)}
    return bi.GLOSS_RE.sub(lambda m: m.group(0) if bi.normalize_term(m.group(1)) in terms else (m.group(2) or m.group(1)), body)


def finalize(raw: str, c: Candidate, cat: Catalog, track: str, generated_by: str, today: str) -> tuple[dict, str]:
    data, body = bi.parse_article(raw)
    taken = set(cat.article_ids)
    slug = unique_slug(slugify(c.title), taken)
    ids_after = taken | {f"paper-{slug}"}
    prereqs = [p for p in (data.get("prerequisites") or []) if isinstance(p, str) and p in taken][:4]
    data.update(
        id=f"paper-{slug}",
        kind="paper",
        slug=slug,
        track=track,
        track_order=cat.next_order(track),
        prerequisites=prereqs,
        paper_title=c.title,
        authors=short_authors(c.authors) or ["Unknown"],
        year=int(c.year) if c.year else dt.date.today().year,
        venue=c.venue or "arXiv",
        paper_url=c.paper_url,
        cover_seed=slug,
        generated_by=generated_by,
        generated_at=today,
        importance_score=c.score or importance_score(c.citations, c.influential, c.year),
    )
    if not isinstance(data.get("topics"), list) or not data["topics"]:
        data["topics"] = ["machine learning"]
    if data.get("difficulty") not in bi.DIFFICULTIES:
        data["difficulty"] = "intermediate"
    body = autofix_body(body, data.get("glossary") or [], ids_after)
    data["read_minutes"] = bi.read_minutes(bi.word_count(body))
    ordered = {k: data[k] for k in FIELD_ORDER if k in data}
    return ordered, body


def render(data: dict, body: str) -> str:
    fm = yaml.safe_dump(data, sort_keys=False, allow_unicode=True, width=1000)
    return f"---\n{fm.rstrip()}\n---\n\n{body.strip()}\n"


def validate(data: dict, body: str, cat: Catalog) -> list[bi.Issue]:
    errors, _ = bi.validate_article(data, body, cat.track_ids, set(cat.article_ids) | {data["id"]})
    return errors


# ---------------------------------------------------------------- main flow

def generate_one(c: Candidate, llm: LLM, cat: Catalog, config: dict, today: str, content: Path = bi.CONTENT, dry_run: bool = False) -> Path | None:
    log_event("paper_start", title=c.title, arxiv=c.arxiv_id, score=c.score)
    paper_text = extract(c.arxiv_id, c.pdf_url, int(config.get("max_input_tokens", 30000)))
    if len(paper_text) < 2000:
        raise GenerationError("Extracted text is too short; the PDF may be scanned or empty.")

    notes_resp = llm.complete(lambda p: notes_messages(c, paper_text, cat, p), temperature=0.2, json_mode=True)
    notes = extract_json(notes_resp.text)
    track = c.track if c.track in cat.track_ids else (notes.get("track") if notes.get("track") in cat.track_ids else "useful-llms")

    def ask(extra: list[dict] | None = None):
        return llm.complete(lambda p: article_messages(c, notes, paper_text, cat, p, track) + (extra or []), temperature=0.6)

    resp = ask()
    raw = resp.text
    for attempt in range(2):
        try:
            data, body = finalize(raw, c, cat, track, resp.generated_by, today)
            errors = validate(data, body, cat)
        except bi.ParseError as e:
            data, body, errors = {}, "", [bi.Issue(e.code, e.message)]
        if not errors:
            break
        log_event("validation_failed", title=c.title, attempt=attempt, errors=[e.message for e in errors])
        if attempt == 1:
            raise GenerationError("; ".join(e.message for e in errors))
        fix = [
            {"role": "assistant", "content": raw},
            {"role": "user", "content": "The file has these problems:\n- " + "\n- ".join(e.message for e in errors)
             + "\n\nReturn the complete corrected file, starting with the line ---."},
        ]
        resp = ask(fix)
        raw = resp.text

    path = content / "papers" / f"{data['slug']}.md"
    if dry_run:
        log_event("dry_run", path=str(path), words=bi.word_count(body))
        print(render(data, body))
        return None
    path.write_text(render(data, body), encoding="utf-8")
    cat.articles.append(data)
    log_event("paper_written", path=str(path.relative_to(content.parent)), generated_by=data["generated_by"], words=bi.word_count(body))
    return path


def candidate_for_arxiv(arxiv_id: str, client: S2Client | None = None) -> Candidate:
    client = client or S2Client()
    from fetch_papers import FIELDS, S2_GRAPH

    p = client._request("GET", f"{S2_GRAPH}/paper/ArXiv:{arxiv_id}", params={"fields": FIELDS})
    c = to_candidate(p, "useful-llms", "manual")
    if not c:
        raise GenerationError(f"Semantic Scholar has no record for arXiv {arxiv_id}")
    c.score = importance_score(c.citations, c.influential, c.year)
    return c


def run(args: argparse.Namespace, content: Path = bi.CONTENT) -> int:
    config = load_config()
    providers = load_providers(config, only=args.provider)
    if not providers:
        msg = "No LLM provider available (set GEMINI_API_KEY or GROQ_API_KEY, or use --provider ollama). Nothing to do."
        log_event("no_providers", message=msg)
        print(msg)
        return 0
    llm = LLM(providers)
    cat = load_catalog(content)
    today = dt.date.today().isoformat()
    count = args.count if args.count is not None else int(config.get("per_day_new", 2))

    if args.arxiv:
        have_arxiv, have_titles = existing_papers(content)
        c = candidate_for_arxiv(args.arxiv)
        if c.arxiv_id in have_arxiv or normalize_title(c.title) in have_titles:
            print(f"Already in content/: {c.title}")
            return 0
        candidates = [c]
    else:
        candidates = fetch_candidates(config, content=content)

    written: list[Path] = []
    for c in candidates[: max(count * 4, count)]:
        if len(written) >= count:
            break
        try:
            path = generate_one(c, llm, cat, config, today, content, dry_run=args.dry_run)
            if path:
                written.append(path)
        except (GenerationError, LLMError, ValueError, json.JSONDecodeError) as e:
            log_event("paper_failed", title=c.title, error=str(e)[:500])
        except Exception as e:  # noqa: BLE001 - keep going with the next paper
            log_event("paper_failed", title=c.title, error=f"{type(e).__name__}: {e}"[:500])

    log_event("run_done", written=[str(p.name) for p in written], requested=count)
    print(f"Wrote {len(written)} article(s): {', '.join(p.name for p in written) or 'none'}")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--count", type=int, default=None, help="articles to write (default: per_day_new)")
    ap.add_argument("--provider", default=None, help="use only this provider (gemini, groq, ollama)")
    ap.add_argument("--arxiv", default=None, help="generate an article for this arXiv id")
    ap.add_argument("--dry-run", action="store_true", help="print instead of writing files")
    sys.exit(run(ap.parse_args()))


if __name__ == "__main__":
    main()
