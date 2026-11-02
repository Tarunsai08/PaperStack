# Writer brief (for parallel article writers)

You write PaperStack seed articles for students preparing for top product and infra company placements. **Articles are the product, so quality is non-negotiable.**

## Read first, in this order

- `CLAUDE.md`
- `pipeline/prompts/writing_guide.md`
- `pipeline/prompts/format.md`: exact frontmatter and the exact H2 sections per kind
- `pipeline/prompts/quality_contract.md`
- Two exemplars of the same kind. Match their depth, tone and structure.
  - pattern: `content/dsa/monotonic-stack.md`
  - problem-walkthrough: `content/dsa/lru-cache.md`
  - concept: `content/famous-algos/diffie-hellman.md`
  - deep-dive: `content/system-design/cache-problems.md`
  - case-study: `content/system-design/chat-system.md`
  - primer: `content/dsa/problem-solving-framework.md`
  - paper: `content/papers/` files with `generated_by: "claude-revised"`
  - lld: none yet, follow format.md

## Per article

- **Inputs:** take `track`, `track_order` (= the entry's `order`), `priority`, `prerequisites`, `kind` and the brief from `content/curriculum/<subject>.json`.
- **Narrative:** a story hook, then one central analogy introduced in an `:::analogy` callout and reused throughout. Intuition comes before any formula.
- **Example:** a fully traced example table using your own numbers. **Compute every number in Python before writing it.**
- **Code:** for DSA and CP, ` ```pseudo ` first, then a compact runnable ` ```cpp ` (C++17) whose `main()` prints the example's results. Compile and run it, and make sure the output matches the comments.
  - Fragments that are not runnable use ` ```cpp partial `.
  - Concept articles need at least a ` ```pseudo ` block.
- **Callouts:**
  - `:::insight`
  - `:::warning` starting "Common misconception: ..."
  - `:::try-this` with the answer in parentheses
- **Glossary:** 3-8 terms, each used in the body as `[[term]]`.
- **Quiz:** exactly 3 questions.
- **Takeaways:** 3-5, full sentences.
- **Length:** no maximum. Write as much as the reader needs to understand the topic completely, and never pad. The validator only enforces a floor (900 prose words for code kinds, 1,100 for deep-dive and case-study). Cover the interview follow-ups, variants, edge cases and pitfalls a candidate needs, and use any presentation that helps: tables, diagrams, traced states, extra examples.
- **Practice problems:** only real, free problems whose exact URL you are certain of. No LeetCode premium. Never copy problem statements.
- **Cross-links:** `[Exact Title](article:<id>)`, and only to articles that exist. Grep `^title` to get the exact title.
- **Facts:** never invent facts, dates, names, numbers or URLs. If unsure, stay qualitative or leave it out. For system design, use only labelled estimates of your own, never company traffic numbers, and never ByteByteGo text.
- **Banned filler:** "delve", "in conclusion", "it is important to note".
- **Frontmatter fields:**
  - `generated_by: "claude-seed"`
  - `generated_at`: today
  - `cover_seed`: the slug
  - `importance_score`: 0.6-0.95

## Boundaries (other writers run in parallel)

- Write only your assigned article files.
- Do not edit the curriculum JSON, PROGRESS.md, HANDOFF.md or DECISIONS.md.
- Do not run `tools/mark_written.py`.
- Do not use git.

## Before finishing

- Run `python3 pipeline/build_index.py --strict`. Fix every warning in your files. "Article exists but status is still planned" is expected; ignore it.
- Run `python3 tools/check_cpp.py <your files>`.

Report in under 150 words: ids, word counts, and anything you left out as unverified.
