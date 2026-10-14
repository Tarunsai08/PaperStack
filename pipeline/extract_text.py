#!/usr/bin/env python3
"""Download a paper's PDF and turn it into clean, sectioned text for the LLM.

- Prefers arXiv PDFs; caches downloads in pipeline/cache/pdf.
- Extracts text with PyMuPDF.
- Splits it into sections by heading, drops references and acknowledgements,
  and trims to a token budget (about 30k tokens by default).

Usage:
    python pipeline/extract_text.py 1706.03762
"""
from __future__ import annotations

import argparse
import hashlib
import re
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from log import log_event  # noqa: E402

CACHE = Path(__file__).resolve().parent / "cache" / "pdf"
CHARS_PER_TOKEN = 4

DROP_SECTIONS = re.compile(r"^(references|bibliography|acknowledg(e)?ments?|appendix|appendices|supplementary material)\b", re.I)

# Headings such as "1 Introduction", "2.3 Training Details", "3. Method", "ABSTRACT", "Conclusion".
HEADING = re.compile(
    r"^(?:(?P<num>\d{1,2}(?:\.\d{1,2}){0,2})\.?\s+(?P<title>[A-Z][A-Za-z0-9 ,:&()\-/]{2,80})"
    r"|(?P<named>abstract|introduction|related work|background|method|methods|approach|model|experiments?|results|discussion|conclusions?|limitations|references|bibliography|acknowledg(?:e)?ments?|appendix))\s*$",
    re.I,
)


@dataclass
class Section:
    title: str
    text: str


def is_heading(line: str) -> str | None:
    s = line.strip()
    if not s or len(s) > 90 or s.endswith((".", ",", ";")) and not re.match(r"^\d", s):
        return None
    m = HEADING.match(s)
    if not m:
        return None
    if m.group("num"):
        # Real section numbers look like 1, 4.2 or 3.1.2; table values like 88.9 or 0.75 do not.
        if any(not (1 <= int(part) <= 20) for part in m.group("num").split(".")):
            return None
        title = m.group("title").strip()
        # Reject things like "2 3 4 5" or table rows with many numbers.
        if sum(ch.isdigit() for ch in title) > 3 or len(title.split()) > 10:
            return None
        return f"{m.group('num')} {title}"
    return m.group("named").strip().title()


def join_split_headings(lines: list[str]) -> list[str]:
    """PDFs often put a heading's number and title on separate lines ("4" then "OUR METHOD")."""
    out: list[str] = []
    i = 0
    while i < len(lines):
        cur = lines[i].strip()
        nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
        if re.fullmatch(r"\d{1,2}(?:\.\d{1,2}){0,2}\.?", cur) and nxt and is_heading(f"{cur.rstrip('.')} {nxt}"):
            out.append(f"{cur.rstrip('.')} {nxt}")
            i += 2
            continue
        out.append(lines[i])
        i += 1
    return out


def split_sections(text: str) -> list[Section]:
    sections: list[Section] = [Section("Front matter", "")]
    buf: list[str] = []
    for line in join_split_headings(text.splitlines()):
        h = is_heading(line)
        if h:
            sections[-1].text = "\n".join(buf).strip()
            sections.append(Section(h, ""))
            buf = []
        else:
            buf.append(line)
    sections[-1].text = "\n".join(buf).strip()
    return [s for s in sections if s.text or s.title != "Front matter"]


def drop_back_matter(sections: list[Section]) -> list[Section]:
    out = []
    for s in sections:
        bare = re.sub(r"^[\d.]+\s*", "", s.title)
        if DROP_SECTIONS.match(bare):
            # Everything after the references is usually appendix material too.
            if bare.lower().startswith(("references", "bibliography")):
                break
            continue
        out.append(s)
    return out


def clean_text(text: str) -> str:
    text = re.sub(r"-\n(?=[a-z])", "", text)  # re-join hyphenated line breaks
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def trim_to_tokens(sections: list[Section], max_tokens: int) -> str:
    """Join sections, keeping whole sections first and truncating the last one."""
    budget = max_tokens * CHARS_PER_TOKEN
    parts: list[str] = []
    used = 0
    for s in sections:
        block = f"## {s.title}\n{s.text}\n"
        if used + len(block) <= budget:
            parts.append(block)
            used += len(block)
            continue
        remaining = budget - used
        if remaining > 500:
            parts.append(block[:remaining].rsplit(" ", 1)[0] + "\n[...truncated]")
        break
    return "\n".join(parts).strip()


def pdf_url_for(arxiv_id: str | None, pdf_url: str | None) -> str:
    if arxiv_id:
        return f"https://arxiv.org/pdf/{arxiv_id}"
    if pdf_url:
        return pdf_url
    raise ValueError("No PDF available for this paper")


def download_pdf(url: str, cache: Path = CACHE) -> Path:
    import requests

    cache.mkdir(parents=True, exist_ok=True)
    path = cache / (hashlib.sha256(url.encode()).hexdigest()[:16] + ".pdf")
    if path.exists() and path.stat().st_size > 1000:
        return path
    resp = requests.get(url, timeout=120, headers={"User-Agent": "PaperStack/1.0 (educational reading app)"})
    resp.raise_for_status()
    if not resp.content.startswith(b"%PDF"):
        raise ValueError(f"Not a PDF: {url}")
    path.write_bytes(resp.content)
    log_event("pdf_downloaded", url=url, bytes=len(resp.content))
    return path


def pdf_to_text(path: Path) -> str:
    try:
        import pymupdf
    except ImportError:  # older PyMuPDF releases only ship the "fitz" name
        import fitz as pymupdf

    with pymupdf.open(path) as doc:
        return "\n".join(page.get_text("text") for page in doc)


def extract(arxiv_id: str | None = None, pdf_url: str | None = None, max_tokens: int = 30000) -> str:
    path = download_pdf(pdf_url_for(arxiv_id, pdf_url))
    raw = clean_text(pdf_to_text(path))
    sections = drop_back_matter(split_sections(raw))
    text = trim_to_tokens(sections, max_tokens)
    log_event("pdf_extracted", sections=len(sections), chars=len(text))
    return text


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("arxiv_id")
    ap.add_argument("--max-tokens", type=int, default=30000)
    args = ap.parse_args()
    print(extract(args.arxiv_id, max_tokens=args.max_tokens))


if __name__ == "__main__":
    main()
