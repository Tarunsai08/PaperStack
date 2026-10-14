import json
import shutil
from argparse import Namespace
from pathlib import Path

import build_index as bi
import generate_article as ga
from llm import Completion
from fetch_papers import Candidate

FIXTURES = Path(__file__).resolve().parents[2] / "tests" / "fixtures"


def make_content(tmp_path):
    content = tmp_path / "content"
    (content / "primers").mkdir(parents=True)
    (content / "papers").mkdir()
    shutil.copy(bi.CONTENT / "tracks.json", content / "tracks.json")
    raw = (FIXTURES / "valid-primer.md").read_text().replace("article:paper-sample", "article:primer-sample")
    (content / "primers" / "sample.md").write_text(raw)
    return content


def model_article(extra_body: str = "") -> str:
    """What a model might return: a fenced file with made-up metadata and a bad link."""
    raw = (FIXTURES / "valid-paper.md").read_text()
    raw = raw.replace('authors: ["Ada Lovelace", "et al."]', 'authors: ["Made Up Person"]')
    raw = raw.replace("Read [the primer](article:primer-sample).", "Read [the primer](article:primer-sample) and [this](article:paper-does-not-exist).")
    raw = raw.replace("The [[model]] looks", "The [[Unlisted Term]] and [[model]] look")
    return "```markdown\n" + raw + extra_body + "```"


class FakeLLM:
    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = []

    def complete(self, messages, temperature=0.4, json_mode=False):
        prov = ga.Provider("fake", "u", "fake-1", max_input_tokens=8000)
        msgs = messages(prov) if callable(messages) else messages
        self.calls.append(msgs)
        return Completion(self.replies.pop(0), "fake", "fake-1", "fake-fake-1")


def candidate():
    return Candidate("Learning Things Quickly", 2024, "ICML", 1500, 120, "2401.00001", "https://arxiv.org/pdf/2401.00001",
                     ["Grace Hopper", "Alan Kay", "Barbara Liskov", "Ken Thompson"], "abstract", "useful-llms", score=0.81)


def test_finalize_overrides_metadata_and_repairs_links(tmp_path):
    content = make_content(tmp_path)
    cat = ga.load_catalog(content)
    data, body = ga.finalize(model_article(), candidate(), cat, "useful-llms", "fake-fake-1", "2026-10-14")
    assert data["id"] == "paper-learning-things-quickly" and data["slug"] == "learning-things-quickly"
    assert data["authors"] == ["Grace Hopper", "Alan Kay", "Barbara Liskov", "et al."]
    assert data["paper_url"] == "https://arxiv.org/abs/2401.00001"
    assert data["year"] == 2024 and data["venue"] == "ICML"
    assert data["generated_by"] == "fake-fake-1" and data["importance_score"] == 0.81
    assert data["track"] == "useful-llms" and data["track_order"] == 1
    assert "article:paper-does-not-exist" not in body and "this" in body
    assert "[[Unlisted Term]]" not in body and "Unlisted Term" in body
    assert ga.validate(data, body, cat) == []


def test_generate_one_writes_a_valid_article(tmp_path, monkeypatch):
    content = make_content(tmp_path)
    cat = ga.load_catalog(content)
    monkeypatch.setattr(ga, "extract", lambda *a, **k: "Paper text. " * 400)
    notes = {"track": "useful-llms", "prerequisites": ["primer-sample"]}
    llm = FakeLLM([json.dumps(notes), model_article()])
    path = ga.generate_one(candidate(), llm, cat, {"max_input_tokens": 8000}, "2026-10-14", content)
    assert path.name == "learning-things-quickly.md"
    data, body = bi.parse_article(path.read_text())
    errors, _ = bi.validate_article(data, body, cat.track_ids, set(cat.article_ids))
    assert errors == []
    # The prompt carried the writing guide and the catalog.
    assert "PaperStack writing guide" in llm.calls[1][0]["content"]
    assert "primer-sample" in llm.calls[0][1]["content"]


def test_generate_one_retries_once_with_validator_errors(tmp_path, monkeypatch):
    content = make_content(tmp_path)
    cat = ga.load_catalog(content)
    monkeypatch.setattr(ga, "extract", lambda *a, **k: "Paper text. " * 400)
    broken = model_article().replace("## What happened next", "## What came after")
    llm = FakeLLM(["{}", broken, model_article()])
    path = ga.generate_one(candidate(), llm, cat, {}, "2026-10-14", content)
    assert path.exists()
    retry_prompt = llm.calls[2][-1]["content"]
    assert "Sections must be" in retry_prompt


def test_run_without_providers_exits_cleanly(tmp_path, monkeypatch, capsys):
    for k in ("GEMINI_API_KEY", "GROQ_API_KEY", "PAPERSTACK_USE_LOCAL"):
        monkeypatch.delenv(k, raising=False)
    assert ga.run(Namespace(provider=None, count=2, arxiv=None, dry_run=False), make_content(tmp_path)) == 0
    assert "Nothing to do" in capsys.readouterr().out


def test_unique_slug_and_short_authors():
    assert ga.unique_slug("lora", {"paper-lora", "paper-lora-2"}) == "lora-3"
    assert ga.short_authors(["A", "B"]) == ["A", "B"]
    assert ga.slugify("LoRA: Low-Rank Adaptation of Large Language Models!") == "lora-low-rank-adaptation-of-large-language-models"
