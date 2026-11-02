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
- [ ] **Seed articles** (owner's rules, 2026-11-02): go **track by track in order** and finish each track completely (all P0, P1 and P2 entries) before starting the next, so the owner can read a topic end to end. Subject priority: **DSA first, then CP, then System Design**, then Famous Algorithms, ML planned entries, CS Core. **No maximum length**: write until the topic is fully understood, using tables, diagrams and traced states generously. Done so far this session: `cp-pbds-ordered-set`, `dsa-subsets-permutations`. Next: DSA tracks in `content/tracks.json` order, starting with the unwritten entries of `dsa-arrays`, then `dsa-search-sort`, `dsa-math`, `dsa-linear`, `dsa-recursion` (continue with `dsa-backtracking-template`), `dsa-trees`, and so on. Run the snippet in section 3 to list missing entries per track.
- [x] **Review and rewrite the 31 Gemini-generated ML articles**: all 31 done (REVIEW_LOG.md has no pending rows).
- [ ] **Expand older articles that were trimmed to fit the old length cap** (owner's request): after each finished track, re-read its older articles and expand any that feel underwritten (missing variants, edge cases, follow-ups or a traced example). Keep ids and slugs.
- [x] **Curriculum-driven daily pipeline** (done: `pipeline/curriculum_generate.py`, plan/draft/critic/revise, quality contract, lint gate, kind-matched exemplars): replace Semantic Scholar discovery with the curriculum queue; per-subject prompts in `pipeline/prompts/<subject>.md`; draft, critic, revise passes; quality gate (validator + C++ check + score threshold); `needs_review` on failure; Gemini retry at most 2 times then Groq; `timeout-minutes: 30`; `[content]` commits that also update curriculum status and `PROGRESS.md`.
- [ ] Final pass: performance, accessibility, tests, README, screenshots of every screen in all themes at phone width.

## 3. How to write one article
List the missing entries per track, in track order:
```bash
python3 -c "import json;T=json.load(open('content/tracks.json'));T=T['tracks'] if isinstance(T,dict) else T
for s in ['dsa','cp','system-design']:
  E=json.load(open(f'content/curriculum/{s}.json'))['entries']
  for t in [t['id'] for t in T if t.get('subject')==s]:
    print(t,[e['id'] for e in sorted(E,key=lambda e:e['order']) if e['track']==t and e['status']!='written'])"
```
1. Pick the first missing entry of the current track (relax a prerequisite in the curriculum JSON if the article can explain that idea itself).
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
- **System Design:** `content/system-design/client-server-http.md`, `content/system-design/dns-deep-dive.md` (deep dives), `content/system-design/back-of-envelope.md` (primer). Case study: `content/system-design/url-shortener.md`, `content/system-design/rate-limiter.md`. Add the first LLD article here once written.
- **Length:** no upper limit. Completeness of understanding is the goal: cover intuition, a traced example, edge cases, variants, interview follow-ups and pitfalls, using tables, diagrams and code wherever they help.

## 5. Common pitfalls
- A `[[Term]]` that is not in the glossary fails validation. So does an `article:` link to an id that does not exist yet.
- Exactly 3 quiz questions with exactly 4 options and `answer` as 0-3.
- Word counts exclude code fences. **There is no maximum length** (owner's rule, 2026-11-02): write until the reader understands the topic completely, with no padding. `--strict` only fails below the minimum: 900 prose words for patterns, walkthroughs, concepts and LLD; 1,000 for primers; 1,100 for deep dives and case studies; 1,400 for papers.
- `practice_problems` URLs must be real (LeetCode slug pages, `https://cses.fi/problemset/task/<id>`, `https://codeforces.com/problemset/problem/<contest>/<letter>`). If you are not certain a link exists, choose a problem you are certain about.
- System design numbers must be labelled as estimates.
- Mermaid labels: short, no quotes, parentheses, colons or brackets.

## 6. If you run low on usage
Stop at a clean point: validators green, curriculum statuses updated, `python tools/progress.py` run, everything committed and pushed. Update the tick boxes in section 2.
