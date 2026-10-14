from extract_text import Section, clean_text, drop_back_matter, is_heading, split_sections, trim_to_tokens

SAMPLE = """Deep Things
Ada Lovelace, Alan Turing
Abstract
We propose a thing.
1 Introduction
Models are big. We make them small-
er and better.
2 Related Work
Many papers exist.
3.1 Training Details
We used Adam with a learning rate of 3e-4.
Table 2 shows the results, which improve by 2 points.
4 Conclusion
It works.
References
[1] Someone. A paper. 2020.
A Appendix material
Extra proofs.
"""


def test_heading_detection():
    assert is_heading("1 Introduction") == "1 Introduction"
    assert is_heading("3.1 Training Details") == "3.1 Training Details"
    assert is_heading("ABSTRACT") == "Abstract"
    assert is_heading("References") == "References"
    assert is_heading("We used Adam with a learning rate of 3e-4.") is None
    assert is_heading("2 3 4 5 6") is None
    assert is_heading("88.9 RoBlarge (LoRA)") is None  # table value, not a section number
    assert is_heading("0.75 Validation Accuracy") is None
    assert is_heading("2.47 GPT-2 M (AdapterH)") is None
    assert is_heading("") is None


def test_split_and_drop_back_matter():
    secs = drop_back_matter(split_sections(clean_text(SAMPLE)))
    titles = [s.title for s in secs]
    assert titles == ["Front matter", "Abstract", "1 Introduction", "2 Related Work", "3.1 Training Details", "4 Conclusion"]
    assert "smaller and better" in secs[2].text  # hyphenated line break re-joined
    assert all("Someone" not in s.text and "Extra proofs" not in s.text for s in secs)


def test_trim_to_tokens_keeps_whole_sections_then_truncates():
    secs = [Section("A", "x " * 400), Section("B", "y " * 400), Section("C", "z " * 4000)]
    out = trim_to_tokens(secs, max_tokens=600)  # about 2,400 characters
    assert out.startswith("## A")
    assert "## B" in out and "[...truncated]" in out
    assert len(out) <= 600 * 4 + 20


def test_trim_small_budget_drops_tail():
    secs = [Section("A", "a " * 100), Section("B", "b " * 5000)]
    out = trim_to_tokens(secs, max_tokens=60)
    assert "## B" not in out


def test_heading_numbers_on_their_own_line_are_joined():
    text = "Intro text\n4\nOUR METHOD\nWe do things.\n4.1\nLow-Rank Updates\nMore.\n12\nThis is a sentence that continues."
    titles = [s.title for s in split_sections(text)]
    assert "4 OUR METHOD" in titles and "4.1 Low-Rank Updates" in titles
    assert not any(t.startswith("12") for t in titles)
