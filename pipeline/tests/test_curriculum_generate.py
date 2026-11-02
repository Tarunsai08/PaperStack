import json
import shutil
from argparse import Namespace
from pathlib import Path

import build_index as bi
import curriculum_generate as cg
from llm import Completion

FIXTURES = Path(__file__).resolve().parents[2] / "tests" / "fixtures"


def entry(eid, order, priority="P0", prereqs=(), status="planned"):
    slug = eid.removeprefix("dsa-")
    return {"id": eid, "slug": slug, "title_working": slug, "subject": "dsa", "kind": "pattern", "track": "dsa-arrays",
            "order": order, "priority": priority, "prerequisites": list(prereqs), "status": status, "written_by": None,
            "brief": {"key_points": ["x"]}}


def make_content(tmp_path, entries):
    content = tmp_path / "content"
    (content / "curriculum").mkdir(parents=True)
    for f in ("tracks.json", "subjects.json"):
        shutil.copy(bi.CONTENT / f, content / f)
    (content / "curriculum" / "dsa.json").write_text(json.dumps({"subject": "dsa", "entries": entries}))
    return content


class FakeLLM:
    """Replies in order; critic calls (json_mode) get the next score."""

    def __init__(self, article, scores):
        self.article, self.scores, self.calls = article, list(scores), []

    def complete(self, messages, temperature=0.4, json_mode=False):
        msgs = messages(cg.Provider("fake", "u", "f", max_input_tokens=30000)) if callable(messages) else messages
        if json_mode and "plan the article" in msgs[-1]["content"]:
            self.calls.append("plan")
            return Completion(json.dumps({"title": "t", "analogy": "a"}), "fake", "f", "fake-f")
        self.calls.append("critic" if json_mode else "write")
        if json_mode:
            s = self.scores.pop(0)
            return Completion(json.dumps({"scores": {}, "overall": s, "problems": ["make the hook sharper"]}), "fake", "f", "fake-f")
        return Completion(self.article, "gemini", "flash", "gemini-flash")


def model_article():
    """A real article at the quality bar, with a wrong id the pipeline must override."""
    return (bi.CONTENT / "dsa" / "two-pointers.md").read_text().replace('id: "dsa-two-pointers"', 'id: "dsa-wrong-id"')


def setup(tmp_path, monkeypatch, scores):
    entries = [entry("dsa-sample", 1), entry("dsa-later", 2, prereqs=["dsa-sample"]), entry("dsa-extra", 3, priority="P2")]
    content = make_content(tmp_path, entries)
    fake = FakeLLM(model_article(), scores)
    monkeypatch.setattr(cg, "LLM", lambda providers: fake)
    monkeypatch.setattr(cg, "load_providers", lambda config, only=None: ["p"])
    monkeypatch.setattr(cg, "DRAFTS", tmp_path / "drafts")
    monkeypatch.setitem(bi.WORD_MIN, "pattern", 1)
    cfg = cg.load_config()
    cfg["daily_mix"] = {"dsa": 1}
    monkeypatch.setattr(cg, "load_config", lambda: cfg)
    return content, fake


def test_pick_entries_respects_prerequisites_and_priority():
    cur = {"entries": [entry("dsa-b", 2, prereqs=["dsa-a"]), entry("dsa-c", 1, priority="P1"), entry("dsa-a", 3)]}
    picked = cg.pick_entries(cur, set(), {"dsa-arrays": 1}, 5)
    assert [e["id"] for e in picked] == ["dsa-a", "dsa-c"]
    picked = cg.pick_entries(cur, {"dsa-a"}, {"dsa-arrays": 1}, 5)
    assert [e["id"] for e in picked][0] == "dsa-b"


def test_good_article_is_published_and_marked_written(tmp_path, monkeypatch):
    content, fake = setup(tmp_path, monkeypatch, scores=[6, 9])
    assert cg.run(Namespace(subject=None, count=None, id=None, provider=None, dry_run=False), content) == 0
    path = content / "dsa" / "sample.md"
    data, _ = bi.parse_article(path.read_text())
    assert data["id"] == "dsa-sample" and data["generated_by"] == "gemini-flash" and data["track_order"] == 1
    assert fake.calls == ["plan", "write", "critic", "write", "critic"]
    cur = json.loads((content / "curriculum" / "dsa.json").read_text())
    assert cur["entries"][0]["status"] == "written"


def test_low_score_goes_to_needs_review_not_the_app(tmp_path, monkeypatch):
    content, _ = setup(tmp_path, monkeypatch, scores=[5, 6])
    cg.run(Namespace(subject=None, count=None, id=None, provider=None, dry_run=False), content)
    assert not (content / "dsa" / "sample.md").exists()
    assert (tmp_path / "drafts" / "dsa-sample.md").exists()
    cur = json.loads((content / "curriculum" / "dsa.json").read_text())
    assert cur["entries"][0]["status"] == "needs_review"


def test_broken_cpp_is_rejected(tmp_path, monkeypatch):
    content, fake = setup(tmp_path, monkeypatch, scores=[9, 9])
    fake.article = fake.article.replace("return slow + 1;\n}", "return slow + 1\n}", 1)
    cg.run(Namespace(subject=None, count=None, id=None, provider=None, dry_run=False), content)
    assert not (content / "dsa" / "sample.md").exists()


def test_no_providers_exits_cleanly(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(cg, "load_providers", lambda config, only=None: [])
    assert cg.run(Namespace(subject=None, count=None, id=None, provider=None, dry_run=False), tmp_path) == 0
    assert "Nothing to do" in capsys.readouterr().out


def test_lint_flags_filler_and_missing_callouts():
    data, body = bi.parse_article(model_article())
    assert cg.lint(data, body)[0] == []
    bad = body.replace(":::warning", ":::history") + "\nMoreover, we delve into it."
    errors, _ = cg.lint(data, bad)
    assert any("warning" in e for e in errors) and any("delve" in e for e in errors)
    data["practice_problems"] = [{"name": "x", "platform": "LeetCode", "url": "https://leetcode.com/two-sum", "difficulty": "Easy"}]
    assert any("URL" in e for e in cg.lint(data, body)[0])
