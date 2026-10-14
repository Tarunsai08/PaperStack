#!/usr/bin/env python3
"""Find important papers that PaperStack does not cover yet.

Uses the Semantic Scholar Graph API (free; an optional S2_API_KEY raises the
rate limit): keyword search for each topic in config.yaml, plus
recommendations seeded with papers already in content/. Candidates are
filtered by citation count and open access, scored for importance, and
anything already in content/ is skipped.

Usage:
    python pipeline/fetch_papers.py --limit 10          # print candidates as JSON
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import re
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterable

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_index import CONTENT, article_files, parse_article  # noqa: E402
from log import log_event  # noqa: E402

S2_GRAPH = "https://api.semanticscholar.org/graph/v1"
S2_RECS = "https://api.semanticscholar.org/recommendations/v1"
FIELDS = "title,year,venue,citationCount,influentialCitationCount,externalIds,openAccessPdf,authors,abstract"
CONFIG = Path(__file__).resolve().parent / "config.yaml"


@dataclass
class Candidate:
    title: str
    year: int | None
    venue: str
    citations: int
    influential: int
    arxiv_id: str | None
    pdf_url: str | None
    authors: list[str]
    abstract: str
    track: str
    s2_id: str = ""
    score: float = 0.0
    sources: list[str] = field(default_factory=list)

    @property
    def paper_url(self) -> str:
        if self.arxiv_id:
            return f"https://arxiv.org/abs/{self.arxiv_id}"
        if self.pdf_url:
            return self.pdf_url
        return f"https://www.semanticscholar.org/paper/{self.s2_id}"


def normalize_title(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", t.lower()).strip()


def importance_score(citations: int, influential: int, year: int | None, now_year: int | None = None) -> float:
    """0..1. Blends total impact, influential citations and citations per year.

    Saturates around 100k citations, 3k influential citations and 10k per year,
    so foundational classics and fast-rising recent papers both score well.
    """
    now_year = now_year or dt.date.today().year
    age = max(1, now_year - (year or now_year) + 1)
    total = min(1.0, math.log10(citations + 1) / 5)
    infl = min(1.0, math.log10(influential + 1) / 3.5)
    per_year = min(1.0, math.log10(citations / age + 1) / 4)
    return round(0.45 * total + 0.25 * infl + 0.30 * per_year, 2)


def existing_papers(content: Path = CONTENT) -> tuple[set[str], set[str]]:
    """arXiv ids and normalized titles of papers already covered."""
    arxiv, titles = set(), set()
    for path in article_files(content):
        try:
            data, _ = parse_article(path.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001 - invalid files are build_index's problem
            continue
        url = str(data.get("paper_url") or "")
        m = re.search(r"arxiv\.org/(?:abs|pdf)/(\d{4}\.\d{4,5})", url)
        if m:
            arxiv.add(m.group(1))
        if data.get("paper_title"):
            titles.add(normalize_title(str(data["paper_title"])))
    return arxiv, titles


class S2Client:
    def __init__(self, api_key: str | None = None, min_interval: float | None = None, sleep: Callable[[float], None] = time.sleep):
        import requests

        self.session = requests.Session()
        self.api_key = api_key if api_key is not None else os.environ.get("S2_API_KEY")
        if self.api_key:
            self.session.headers["x-api-key"] = self.api_key
        self.session.headers["User-Agent"] = "PaperStack/1.0 (educational reading app)"
        # Unauthenticated access shares a public pool; be gentle.
        self.min_interval = min_interval if min_interval is not None else (1.1 if self.api_key else 3.0)
        self.sleep = sleep
        self._last = 0.0

    def _request(self, method: str, url: str, **kw) -> Any:
        for attempt in range(6):
            wait = self.min_interval - (time.monotonic() - self._last)
            if wait > 0:
                self.sleep(wait)
            self._last = time.monotonic()
            resp = self.session.request(method, url, timeout=60, **kw)
            if resp.status_code == 429 or resp.status_code >= 500:
                backoff = 2 ** (attempt + 1)
                log_event("s2_retry", status=resp.status_code, url=url, wait=backoff)
                self.sleep(backoff)
                continue
            resp.raise_for_status()
            return resp.json()
        raise RuntimeError(f"Semantic Scholar kept failing for {url}")

    def search(self, query: str, min_citations: int, open_access: bool, limit: int = 100) -> list[dict]:
        params = {"query": query, "fields": FIELDS, "limit": limit, "minCitationCount": min_citations}
        if open_access:
            params["openAccessPdf"] = ""
        return self._request("GET", f"{S2_GRAPH}/paper/search", params=params).get("data") or []

    def recommend(self, seed_id: str, limit: int = 50) -> list[dict]:
        # The multi-seed endpoint only returns very recent papers; "all-cs" searches every CS paper.
        params = {"fields": FIELDS, "limit": limit, "from": "all-cs"}
        data = self._request("GET", f"{S2_RECS}/papers/forpaper/{seed_id}", params=params)
        return data.get("recommendedPapers") or []


def to_candidate(p: dict, track: str, source: str) -> Candidate | None:
    if not p or not p.get("title"):
        return None
    ext = p.get("externalIds") or {}
    pdf = (p.get("openAccessPdf") or {}).get("url") or None
    arxiv_id = ext.get("ArXiv")
    if arxiv_id and not pdf:
        pdf = f"https://arxiv.org/pdf/{arxiv_id}"
    return Candidate(
        title=p["title"].strip(),
        year=p.get("year"),
        venue=(p.get("venue") or "").strip() or ("arXiv" if arxiv_id else ""),
        citations=int(p.get("citationCount") or 0),
        influential=int(p.get("influentialCitationCount") or 0),
        arxiv_id=arxiv_id,
        pdf_url=pdf,
        authors=[a.get("name", "") for a in (p.get("authors") or []) if a.get("name")],
        abstract=(p.get("abstract") or "").strip(),
        track=track,
        s2_id=p.get("paperId") or "",
        sources=[source],
    )


def select_candidates(
    raw: Iterable[Candidate],
    have_arxiv: set[str],
    have_titles: set[str],
    min_citations: int,
    prefer_open_access: bool,
    now_year: int | None = None,
) -> list[Candidate]:
    """Filter, de-duplicate and rank. Pure, so it is easy to test."""
    best: dict[str, Candidate] = {}
    for c in raw:
        if c.citations < min_citations:
            continue
        if prefer_open_access and not c.pdf_url:
            continue
        key = c.arxiv_id or normalize_title(c.title)
        if (c.arxiv_id and c.arxiv_id in have_arxiv) or normalize_title(c.title) in have_titles:
            continue
        c.score = importance_score(c.citations, c.influential, c.year, now_year)
        if key in best:
            best[key].sources = sorted(set(best[key].sources + c.sources))
            continue
        best[key] = c
    return sorted(best.values(), key=lambda c: (-c.score, -c.citations, c.title))


def fetch_candidates(config: dict, client: S2Client | None = None, content: Path = CONTENT) -> list[Candidate]:
    client = client or S2Client()
    min_c = int(config.get("min_citations", 200))
    oa = bool(config.get("prefer_open_access", True))
    have_arxiv, have_titles = existing_papers(content)
    raw: list[Candidate] = []
    for topic in config.get("topics", []):
        try:
            for p in client.search(topic["query"], min_c, oa):
                c = to_candidate(p, topic["track"], f"search:{topic['name']}")
                if c:
                    raw.append(c)
        except Exception as e:  # noqa: BLE001 - one bad topic should not stop the run
            log_event("s2_search_failed", topic=topic["name"], error=str(e)[:200])
    # Recommendations seeded with a few covered papers, rotating daily so the pool keeps changing.
    seeds = sorted(have_arxiv)
    day = dt.date.today().toordinal()
    for i in range(min(3, len(seeds))):
        seed = seeds[(day * 3 + i) % len(seeds)]
        try:
            for p in client.recommend(f"ArXiv:{seed}"):
                c = to_candidate(p, "useful-llms", f"recommendations:{seed}")
                if c:
                    raw.append(c)
        except Exception as e:  # noqa: BLE001
            log_event("s2_recommend_failed", seed=seed, error=str(e)[:200])
    picked = select_candidates(raw, have_arxiv, have_titles, min_c, oa)
    log_event("candidates", raw=len(raw), selected=len(picked))
    if len(picked) < int(config.get("per_day_new", 2)):
        picked += seed_candidates(config, have_arxiv, have_titles, exclude={c.arxiv_id for c in picked})
    return picked


def parse_arxiv_feed(xml_text: str) -> list[dict]:
    """Minimal parser for the arXiv Atom API: id, title, authors, year, abstract."""
    import xml.etree.ElementTree as ET

    ns = {"a": "http://www.w3.org/2005/Atom"}
    out = []
    for e in ET.fromstring(xml_text).findall("a:entry", ns):
        raw_id = (e.findtext("a:id", default="", namespaces=ns) or "").rsplit("/", 1)[-1]
        arxiv_id = re.sub(r"v\d+$", "", raw_id)
        title = re.sub(r"\s+", " ", e.findtext("a:title", default="", namespaces=ns) or "").strip()
        if not arxiv_id or not title:
            continue
        out.append({
            "arxiv": arxiv_id,
            "title": title,
            "authors": [a.findtext("a:name", default="", namespaces=ns) for a in e.findall("a:author", ns)],
            "year": int((e.findtext("a:published", default="0", namespaces=ns) or "0")[:4] or 0) or None,
            "abstract": re.sub(r"\s+", " ", e.findtext("a:summary", default="", namespaces=ns) or "").strip(),
        })
    return out


def seed_candidates(config: dict, have_arxiv: set[str], have_titles: set[str], exclude: set[str | None] = frozenset()) -> list[Candidate]:
    """Candidates from the curated seed_papers list, with metadata from the arXiv API (no key needed)."""
    import requests

    seeds = [s for s in config.get("seed_papers") or [] if s.get("arxiv") and s["arxiv"] not in have_arxiv and s["arxiv"] not in exclude]
    if not seeds:
        return []
    want = seeds[: max(4, int(config.get("per_day_new", 2)) * 3)]
    try:
        resp = requests.get(
            "https://export.arxiv.org/api/query",
            params={"id_list": ",".join(s["arxiv"] for s in want), "max_results": len(want)},
            timeout=60,
            headers={"User-Agent": "PaperStack/1.0 (educational reading app)"},
        )
        resp.raise_for_status()
        meta = {m["arxiv"]: m for m in parse_arxiv_feed(resp.text)}
    except Exception as e:  # noqa: BLE001
        log_event("arxiv_seed_failed", error=str(e)[:200])
        return []
    out = []
    for s in want:
        m = meta.get(s["arxiv"])
        if not m or normalize_title(m["title"]) in have_titles:
            continue
        out.append(Candidate(
            title=m["title"], year=m["year"], venue="arXiv", citations=0, influential=0,
            arxiv_id=s["arxiv"], pdf_url=f"https://arxiv.org/pdf/{s['arxiv']}", authors=m["authors"],
            abstract=m["abstract"], track=s.get("track", "useful-llms"),
            score=float(config.get("seed_importance", 0.8)), sources=["seed"],
        ))
    log_event("seed_candidates", count=len(out))
    return out


def load_config(path: Path = CONFIG) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--limit", type=int, default=10)
    args = ap.parse_args()
    cands = fetch_candidates(load_config())
    print(json.dumps([asdict(c) | {"paper_url": c.paper_url} for c in cands[: args.limit]], indent=2))


if __name__ == "__main__":
    main()
