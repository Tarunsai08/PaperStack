# PaperStack: rules for Claude

**Read `HANDOFF.md` first.** It says what is done, what is next, and how to continue without asking the owner anything.

## What this is
A Substack-style learning app (React + Capacitor APK + GitHub Pages PWA) for a CS student preparing for top product and infra company placements. Subjects: Machine Learning, DSA, Competitive Programming, Famous Algorithms, System Design, and CS Core (planned, "coming soon"). Content is Markdown in `content/`; the app validates and renders it offline.

## Non-negotiables
- **Articles are the product.** Follow `pipeline/prompts/writing_guide.md` and `pipeline/prompts/format.md` exactly. Story-style hook, one central analogy reused throughout, intuition before formulas, a traced example, callouts, glossary (3-8), exactly 3 quiz questions, 3-5 full-sentence takeaways. No filler ("delve", "in conclusion", "it is important to note").
- **Ideas before code.** Pseudocode (```pseudo) first; then compact C++17 (```cpp) for DSA and CP. Every runnable ```cpp block must compile; fragments are ```cpp partial.
- **Never invent facts, numbers, quotes or problem links.** If unsure, say it qualitatively or leave it out, and log it in `DECISIONS.md`. Never copy problem statements or ByteByteGo text/images; draw diagrams yourself.
- **Do not break the UI or saved data.** Keep ML ids, slugs and folders stable (progress and highlights are keyed by id). Keep the existing design language (see `docs/screenshots/`).
- **The curriculum JSON `status` is the source of truth** for what is written. Update it in the same commit as the article.
- **Commit after every batch of about 5 articles.** Never leave work only in chat.

## Commands (from the repo root)
```bash
python pipeline/build_index.py           # validate all content + curricula, write index.json and roadmap.json
python pipeline/build_index.py --strict  # also fail on warnings such as too-short articles (no maximum length; CI uses this on branches)
python tools/check_cpp.py                # compile every runnable C++ block (g++ -std=c++17)
python tools/progress.py                 # regenerate PROGRESS.md (run before every commit)
python -m pytest -q pipeline/tests       # pipeline + validator tests
cd app && npm run lint && npm test -- --run && npm run build
```

## Layout
- `content/<subject>/*.md` articles (ML keeps `content/papers` and `content/primers`).
- `content/curriculum/<subject>.json` the full plan per subject, with a writer brief per entry.
- `content/subjects.json`, `content/tracks.json` subject and track metadata.
- `app/src/lib/frontmatter.ts` and `pipeline/build_index.py` implement the **same** validation rules; change both together and add a case to `tests/fixtures/cases.json`.
- `pipeline/` daily generation from the curriculum (Gemini/Groq), prompts in `pipeline/prompts/`.
- `tools/` progress, C++ compile check.

## Commit messages
Normal work: plain descriptive messages. Daily pipeline commits start with `[content]` (the APK workflow skips those).
