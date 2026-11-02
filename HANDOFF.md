# Handoff: how to continue PaperStack

You are continuing a project another Claude session started. Everything you need is in the repo. Do not ask the owner questions unless truly blocked; choose the sensible option and log it in `DECISIONS.md`.

## 1. Get oriented (5 minutes)
1. Read `CLAUDE.md` (rules and commands).
2. Run `python tools/progress.py` and open `PROGRESS.md`: per-subject counts and the **next 10 entries to write** for each subject.
3. Skim the exemplars below for the subject you will write.

## 2. Where the v2 plan stands
The owner's v2 brief, in execution order. Tick boxes reflect the repo at the last commit.

- [x] Multi-subject architecture: `subjects.json`, subject-aware tracks, new kinds (`pattern`, `problem-walkthrough`, `concept`, `deep-dive`, `case-study`, `lld`), shared TS/Python validators with fixtures, ML migrated with `subject: "ml"` (ids unchanged).
- [x] Curricula for every subject in `content/curriculum/` (ML 119, DSA 152, CP 115, Famous Algorithms 91, System Design 119, CS Core 77 planned). They are designed for completeness for placements, not to hit a count.
- [x] App: subject cards on Home, subject-scoped Learn, Placement Roadmap (`/roadmap`), practice-problem checklists with per-subject solved counts, pseudocode and C++ blocks with copy and offline highlighting, subject filters in Search and Library.
- [x] `CLAUDE.md`, this file, `tools/progress.py`, `tools/check_cpp.py` (in CI).
- [ ] **Seed articles**: about 50 each for DSA, CP, Famous Algorithms, System Design. Rotate subjects in rounds of 10 (first 10 of each, then the next 10, ...), batches of about 5, commit after each batch.
- [ ] **Review and rewrite the 31 Gemini-generated ML articles** (`generated_by: gemini-*`). Log before/after scores in `REVIEW_LOG.md`. Keep `id`, `slug`, `paper_url`; set `generated_by: "claude-revised"`.
- [x] **Curriculum-driven daily pipeline** (done: `pipeline/curriculum_generate.py`, plan/draft/critic/revise, quality contract, lint gate, kind-matched exemplars): replace Semantic Scholar discovery with the curriculum queue; per-subject prompts in `pipeline/prompts/<subject>.md`; draft, critic, revise passes; quality gate (validator + C++ check + score threshold); `needs_review` on failure; Gemini retry at most 2 times then Groq; `timeout-minutes: 30`; `[content]` commits that also update curriculum status and `PROGRESS.md`.
- [ ] Final pass: performance, accessibility, tests, README, screenshots of every screen in all themes at phone width.

## 3. How to write one article
1. Pick the next entry from `PROGRESS.md` (prerequisites are already written).
2. Read its `brief` in `content/curriculum/<subject>.json`: key points, analogy, what to include, traps, exact facts.
3. Write `content/<subject>/<slug>.md` with `id` = the curriculum id, the exact sections for its `kind` (see `pipeline/prompts/format.md`), `generated_by: "claude-seed"`, today's date, `track` and `track_order` from the curriculum (`order`).
4. Set the entry's `status` to `"written"` and `written_by` to `"claude-seed"`.
5. Every 5 articles: `python pipeline/build_index.py --strict && python tools/check_cpp.py && python tools/progress.py`, then commit and push.

### Prerequisites and links
Only link (`[text](article:<id>)`) and list prerequisites that **already exist as articles**, or the validator fails. If the curriculum lists a prerequisite that is not written yet, either write it first or drop it from the article's frontmatter (keep it in the curriculum).

## 4. Exemplars to imitate
- **ML:** `content/primers/gradient-descent.md`, `content/papers/attention-is-all-you-need.md`, `content/papers/resnet.md`.
- **DSA:** `content/dsa/prefix-sums.md`, `content/dsa/two-pointers.md`, `content/dsa/binary-search.md` (patterns), `content/dsa/big-o.md` (primer). Add a walkthrough exemplar once written.
- **CP:** `content/cp/stress-testing.md` (pattern), `content/cp/how-contests-work.md`, `content/cp/fast-io-template.md` (primers).
- **Famous Algorithms:** `content/famous-algos/bloom-filter.md`, `content/famous-algos/consistent-hashing.md`, `content/famous-algos/hyperloglog.md`.
- **System Design:** `content/system-design/client-server-http.md`, `content/system-design/dns-deep-dive.md` (deep dives), `content/system-design/back-of-envelope.md` (primer). Add the first case study and LLD article here once written.
- **Length tip:** first drafts tend to land 5-15% short of the minimum; aim for the middle of the range.

## 5. Common pitfalls
- A `[[Term]]` that is not in the glossary fails validation. So does an `article:` link to an id that does not exist yet.
- Exactly 3 quiz questions with exactly 4 options and `answer` as 0-3.
- Word counts exclude code fences. Patterns, walkthroughs, concepts and LLD aim for 900-2,000 prose words (code excluded); primers 1,000-1,600; deep dives and case studies 1,100-2,200; `--strict` fails outside the range.
- `practice_problems` URLs must be real (LeetCode slug pages, `https://cses.fi/problemset/task/<id>`, `https://codeforces.com/problemset/problem/<contest>/<letter>`). If you are not certain a link exists, choose a problem you are certain about.
- System design numbers must be labelled as estimates.
- Mermaid labels: short, no quotes, parentheses, colons or brackets.

## 6. If you run low on usage
Stop at a clean point: validators green, curriculum statuses updated, `python tools/progress.py` run, everything committed and pushed. Update the tick boxes in section 2.
