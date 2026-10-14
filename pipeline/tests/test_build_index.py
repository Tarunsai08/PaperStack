import json
import shutil
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import build_index as bi  # noqa: E402

FIXTURES = Path(__file__).resolve().parents[2] / "tests" / "fixtures"
CASES = json.loads((FIXTURES / "cases.json").read_text())


def run_case(file: str):
    raw = (FIXTURES / file).read_text()
    try:
        data, body = bi.parse_article(raw)
    except bi.ParseError as e:
        return [e.code]
    errors, _ = bi.validate_article(data, body, CASES["tracks"], CASES["articleIds"])
    return [e.code for e in errors]


@pytest.mark.parametrize("case", CASES["cases"], ids=lambda c: c["file"])
def test_shared_fixtures(case):
    codes = run_case(case["file"])
    assert (len(codes) == 0) == case["ok"], codes
    for expected in case["errors"]:
        assert expected in codes, f"{expected} not in {codes}"


@pytest.mark.parametrize("case", CASES["wordCounts"])
def test_word_count(case):
    assert bi.word_count(case["text"]) == case["words"]


def test_normalize_term_plurals():
    assert bi.normalize_term("Tokens") == bi.normalize_term("token")
    assert bi.normalize_term("Embeddings") == "embedding"
    assert bi.normalize_term("Probabilities") == "probability"
    assert bi.normalize_term("Loss") == "loss"
    assert bi.normalize_term("Batches") == "batch"


def test_unquoted_date_is_normalized():
    data, _ = bi.parse_article((FIXTURES / "valid-primer.md").read_text())
    assert data["generated_at"] == "2026-10-14"


def test_excerpt_skips_hook_heading_and_truncates():
    body = "## The hook\n\n" + ("word " * 200)
    ex = bi.excerpt(body)
    assert not ex.startswith("The hook")
    assert len(ex) <= 301
    assert ex.endswith("…")


def test_read_minutes_rounds_half_up():
    assert bi.read_minutes(330) == 2  # 1.5 -> 2, like JS Math.round
    assert bi.read_minutes(10) == 1


def make_content(tmp_path: Path) -> Path:
    content = tmp_path / "content"
    (content / "primers").mkdir(parents=True)
    (content / "papers").mkdir()
    tracks = [
        {"id": "start-here", "title": "S", "subtitle": "s", "order": 0, "accent": "#000000"},
        {"id": "transformers-llms", "title": "T", "subtitle": "t", "order": 6, "accent": "#000000"},
    ]
    (content / "tracks.json").write_text(json.dumps(tracks))
    shutil.copy(FIXTURES / "valid-primer.md", content / "primers" / "sample.md")
    shutil.copy(FIXTURES / "valid-paper.md", content / "papers" / "sample.md")
    return content


def test_build_writes_index(tmp_path):
    content = make_content(tmp_path)
    assert bi.build(content) == 0
    index = json.loads((content / "index.json").read_text())
    assert index["count"] == 2
    assert [a["id"] for a in index["articles"]] == ["primer-sample", "paper-sample"]
    first = index["articles"][0]
    assert first["path"] == "primers/sample.md"
    assert len(first["hash"]) == 12 and first["word_count"] > 0
    assert len(index["content_version"]) == 16


def test_content_version_changes_with_content(tmp_path):
    content = make_content(tmp_path)
    bi.build(content)
    v1 = json.loads((content / "index.json").read_text())["content_version"]
    p = content / "primers" / "sample.md"
    p.write_text(p.read_text().replace("Everywhere.", "Everywhere, really."))
    bi.build(content)
    v2 = json.loads((content / "index.json").read_text())["content_version"]
    assert v1 != v2


def test_build_fails_on_broken_cross_reference(tmp_path):
    content = make_content(tmp_path)
    (content / "papers" / "sample.md").unlink()
    assert bi.build(content, write=False) == 1  # primer links to article:paper-sample
    assert bi.build(content, partial=True, write=False) == 0


def test_build_rejects_slug_mismatch(tmp_path):
    content = make_content(tmp_path)
    (content / "primers" / "sample.md").rename(content / "primers" / "other.md")
    assert bi.build(content, write=False) == 1


def test_strict_mode_fails_on_length_warnings(tmp_path):
    content = make_content(tmp_path)
    assert bi.build(content, strict=True, write=False) == 1
