from fetch_papers import Candidate, importance_score, normalize_title, select_candidates, to_candidate


def cand(title, citations=1000, influential=100, year=2020, arxiv="2001.00001", pdf="https://x/p.pdf", track="foundations", source="search"):
    return Candidate(title, year, "NeurIPS", citations, influential, arxiv, pdf, ["A. Author"], "abs", track, sources=[source])


def test_importance_score_is_bounded_and_monotonic():
    lo = importance_score(200, 5, 2015, now_year=2026)
    hi = importance_score(100_000, 3_000, 2015, now_year=2026)
    assert 0 <= lo < hi <= 1
    assert importance_score(5000, 300, 2020, 2026) > importance_score(500, 300, 2020, 2026)


def test_importance_rewards_fast_rising_recent_papers():
    old = importance_score(5000, 300, 1995, now_year=2026)
    new = importance_score(5000, 300, 2024, now_year=2026)
    assert new > old


def test_select_filters_and_ranks():
    raw = [
        cand("Low Citations", citations=50, arxiv="1"),
        cand("No PDF", arxiv=None, pdf=None),
        cand("Already Have It", arxiv="1706.03762"),
        cand("Attention is all you need!", arxiv="9999.99999"),  # title match despite different id
        cand("Strong Paper", citations=20000, influential=2000, arxiv="2"),
        cand("Decent Paper", citations=900, influential=40, arxiv="3"),
        cand("Strong Paper", citations=20000, influential=2000, arxiv="2", source="recommendations"),
    ]
    out = select_candidates(raw, {"1706.03762"}, {normalize_title("Attention Is All You Need")}, 200, True, now_year=2026)
    assert [c.title for c in out] == ["Strong Paper", "Decent Paper"]
    assert out[0].sources == ["recommendations", "search"]
    assert out[0].score > out[1].score > 0


def test_open_access_filter_can_be_disabled():
    out = select_candidates([cand("No PDF", arxiv=None, pdf=None)], set(), set(), 200, False)
    assert len(out) == 1


def test_to_candidate_builds_arxiv_links():
    c = to_candidate(
        {"paperId": "abc", "title": " LoRA ", "year": 2021, "citationCount": 5000, "influentialCitationCount": 900,
         "externalIds": {"ArXiv": "2106.09685"}, "openAccessPdf": None, "authors": [{"name": "Edward Hu"}], "venue": ""},
        "useful-llms", "search",
    )
    assert c.title == "LoRA" and c.venue == "arXiv"
    assert c.pdf_url == "https://arxiv.org/pdf/2106.09685"
    assert c.paper_url == "https://arxiv.org/abs/2106.09685"


ATOM = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/1607.06450v1</id>
    <published>2016-07-21T19:57:52Z</published>
    <title>Layer
      Normalization</title>
    <summary>  Training deep networks is expensive.  </summary>
    <author><name>Jimmy Lei Ba</name></author>
    <author><name>Jamie Ryan Kiros</name></author>
  </entry>
</feed>"""


def test_parse_arxiv_feed():
    from fetch_papers import parse_arxiv_feed

    [m] = parse_arxiv_feed(ATOM)
    assert m == {"arxiv": "1607.06450", "title": "Layer Normalization", "authors": ["Jimmy Lei Ba", "Jamie Ryan Kiros"],
                 "year": 2016, "abstract": "Training deep networks is expensive."}


def test_seed_candidates_skip_covered_papers(monkeypatch):
    import fetch_papers

    class Resp:
        text = ATOM

        def raise_for_status(self):
            pass

    import requests
    monkeypatch.setattr(requests, "get", lambda *a, **k: Resp())
    cfg = {"seed_papers": [{"arxiv": "1706.03762", "track": "transformers-llms"}, {"arxiv": "1607.06450", "track": "deep-learning"}],
           "seed_importance": 0.7}
    out = fetch_papers.seed_candidates(cfg, {"1706.03762"}, set())
    assert [(c.arxiv_id, c.track, c.score, c.venue) for c in out] == [("1607.06450", "deep-learning", 0.7, "arXiv")]
    assert out[0].paper_url == "https://arxiv.org/abs/1607.06450"


def test_seed_papers_in_config_are_well_formed():
    from fetch_papers import load_config

    cfg = load_config()
    tracks = {"start-here", "foundations", "deep-learning", "sequences-language", "generative", "reinforcement",
              "transformers-llms", "useful-llms", "ai-systems"}
    seeds = cfg["seed_papers"]
    assert len(seeds) >= 20
    assert all(s["track"] in tracks for s in seeds)
    assert len({s["arxiv"] for s in seeds}) == len(seeds)
