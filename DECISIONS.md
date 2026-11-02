# Decisions

Choices made while building, so nobody has to guess later.

## Platform and tooling

- **Pinned, well-known versions** rather than the very latest majors: Vite 6, React 19, React Router 6, Tailwind 3, Capacitor 7, Mermaid 11, ESLint 9, TypeScript 5.8. Newer majors existed but changed APIs; these are stable and well documented.
- **Capacitor 7** targets Android SDK 35 and Java 21, matching the CI workflow.
- **Hash routing** (`#/article/...`) plus Vite `base: './'`: one build runs unchanged on GitHub Pages under `/<repo>/` and inside the APK. No 404 tricks needed.
- **Node 22 in CI** (the spec mentioned Node 20; Node 22 is the current LTS and is what Capacitor 7 tooling is tested against).

## Content format

- **Glossary link syntax** is `[[Term]]` or `[[Term|shown text]]` (wiki style: target first). Every marked term must exist in the article's glossary; the validator enforces it.
- **Sections are exact.** The validator requires exactly the H2 headings from the spec, in order, with no extra H2s. Sub-headings use H3.
- **Read time in `index.json` is computed** from the word count (220 words per minute), so it stays honest even if the frontmatter value is off.
- **Length limits are warnings, not errors**, so pipeline content is not rejected over a few words. `build_index.py --strict` turns them into errors; the seed articles pass in strict mode.
- **`--partial` flag** on `build_index.py` downgrades links to articles that do not exist yet. It was only used while the seed content was being written; CI runs without it.
- **`index.json` is deterministic**: its `generated_at` is the newest article date, not the current time, so rebuilding without content changes never creates a diff.
- **Shared rules, two languages.** `app/src/lib/frontmatter.ts` and `pipeline/build_index.py` implement the same checks and are tested against the same fixtures in `tests/fixtures/cases.json`.
- **Shared prompts.** The writing guide and format spec live once in `pipeline/prompts/*.md`. The app imports them for the manual-import prompt; the pipeline reads them for generation.

## App behaviour

- **Highlights use the CSS Custom Highlight API** (Chromium 105+, so every Android WebView that Capacitor 7 supports). Offsets skip diagrams and math, so late rendering cannot shift them. Browsers without the API still save highlights and list them in the Library; they just are not painted inline.
- **Imported articles never override official ones.** If an import reuses an official id, it is saved as `<id>-mine`.
- **Manual import auto-fix**: unknown prerequisites, unknown `article:` links, unknown `[[terms]]`, bad dates and bad ids can be repaired with one tap, because fixing YAML on a phone is miserable.
- **Remote content sync** stores only articles that differ from the bundled copy. Remote articles are validated before they are stored; invalid ones are skipped silently.
- **Status bar**: the app opts out of Android 15 edge-to-edge (`windowOptOutEdgeToEdgeEnforcement`) so the status bar can be tinted to match each theme.
- **Primary buttons** use a deeper orange (`#C94A0C`) behind white text so the label meets WCAG AA contrast; the brand orange `#FF6719` is used for accents, icons and the logo.
- **System font size** on Android comes from the Capacitor text-zoom plugin (the WebView ignores the system setting otherwise). It scales the whole UI; the reader's own text-size slider stacks on top.
- **Sepia accent text** is `rgb(168 60 10)` rather than the light theme's value, because the lighter orange fell to 4.4:1 on sepia's secondary surface.
- **Start-up bundle**: plain-text helpers (word count, excerpt, read time) live in `markdownText.ts`; the YAML parser and validator load only when an article is opened, synced or imported.
- **Reminders** use inexact daily alarms (no exact-alarm permission), which is fine for a reading nudge.

## Seed content accuracy

- **Every paper link was checked** against the live source in this session: all 28 arXiv IDs were confirmed against the arXiv API (titles match), the NeurIPS AlexNet page and the OpenAI GPT-1 PDF return 200, and the 12 DOIs resolve to the right publisher pages (publishers return 403 to scripts, but the DOI redirects and Crossref metadata match).
- **Numbers in articles** are ones the papers report (for example AlexNet's 15.3% vs 26.2% top-5 error, BERT's GLUE 80.5, Chinchilla's 67.5% MMLU). Where a figure is approximate in the paper or commonly rounded, the article says "about."
- **Anecdotes** that come from interviews rather than the papers (Goodfellow's bar story, AlexNet trained in a bedroom) are marked as reported or as the person's own account.
- **GAN title**: the arXiv listing says "Generative Adversarial Networks"; the NeurIPS proceedings title, used here, is "Generative Adversarial Nets."
- **Venue for preprint-only papers** (PPO, Scaling Laws, Megatron-LM, LLaMA) is "arXiv"; GPT-1 is an "OpenAI technical report."

## Android and CI

- **App id** is the placeholder `com.paperstack.reader`. The README explains how to change it before the first real install.
- **Signing**: `app/android/app/build.gradle` signs release builds only when `release.jks` exists and `ANDROID_KEYSTORE_PASSWORD` is set. Without the secrets, CI builds a debug APK and the release notes carry a clear warning.
- **Version numbers** come from `-PversionCode` / `-PversionName`; CI passes the run number, so every APK installs over the previous one.
- **Content-only commits** (messages containing `[content]`) skip the APK job via a job-level `if`, not `paths-ignore`, so seed-content commits still build APKs.
- **A separate `ci.yml`** runs tests, lint, strict validation and a web build on pull requests and non-main branches, so problems are caught before they reach `main`.
- **Local Gradle builds in the sandbox** used Google's Maven Central mirror through a user-level init script, because Maven Central rate-limited the sandbox. Nothing about this is in the repository; CI uses the normal repositories.

## Pipeline

- **Metadata is authoritative, not generated.** Title, authors, year, venue, link, id, slug, track order, `generated_by` and `importance_score` are set by the pipeline from Semantic Scholar or arXiv, overriding whatever the model writes.
- **Discovery has a fallback.** Semantic Scholar's anonymous quota was exhausted from this environment (HTTP 429), and OpenAlex now requires a key, so `config.yaml` carries a curated `seed_papers` queue of 40 important papers (every arXiv id verified against the arXiv API). It is used whenever discovery finds fewer papers than needed.
- **Recommendations** use the per-paper endpoint with `from=all-cs`; the multi-seed endpoint only returns very recent papers, which never pass the citation filter.
- **Per-provider prompt budgets** (`max_input_tokens`): Groq's free tier has tight tokens-per-minute limits, so it gets a shorter paper excerpt than Gemini.
- **Local providers are opt-in.** Ollama is only used with `--provider ollama` or `PAPERSTACK_USE_LOCAL=1`, so CI never waits on a localhost connection.
- **Small slips are repaired, not rejected.** Unknown `article:` links become plain text and `[[terms]]` missing from the glossary lose their brackets; structural problems trigger one retry with the validator's exact messages.
- **The daily workflow starts the web deploy itself** with `gh workflow run`, because pushes made with `GITHUB_TOKEN` do not trigger other workflows.

## v2: multiple subjects

- **Subjects live in `content/subjects.json`** and are copied into `index.json` (`subjects`), so content sync delivers new subjects without a new APK. Tracks gained a `subject` field; old tracks without it are treated as `ml`.
- **ML ids, slugs and folders did not change.** ML articles only gained `subject: "ml"`. Progress, highlights and quiz scores are keyed by article id, so they survive untouched. New IndexedDB keys (`problems`, `prefs.subject`, `prefs.roadmapMonths`) get defaults through the existing merge-on-load, so no explicit migration step is needed.
- **Id prefix rule:** ML keeps `paper-` / `primer-`; every other subject uses `<subject>-` (for example `dsa-prefix-sums`). New subjects live in `content/<subject>/`.
- **New kinds and their exact sections:** `pattern`, `problem-walkthrough`, `concept`, `deep-dive`, `case-study` (see `pipeline/build_index.py` `SECTIONS`). Primers are allowed in any subject. `paper` is ML only.
- **Pseudocode first, C++ second** (the reader asked for the gist of each idea over code). `pattern`, `problem-walkthrough` and `concept` need a ```pseudo or ```cpp block. DSA and CP articles give pseudocode and a compact C++ version; Famous Algorithms and System Design may use pseudocode only.
- **C++ compile check:** every ```cpp fence must compile on its own with `g++ -std=c++17 -fsyntax-only -Wall` (`tools/check_cpp.py`, run in every workflow). Fragments are fenced as ```cpp partial and skipped. Syntax-only is enough to catch broken code without needing a `main` in every snippet.
- **Syntax highlighting** uses highlight.js core + the C++ grammar only, lazy-loaded and bundled (works offline). Colours are theme tokens (`--code-*`) chosen for AA contrast on each theme's code background.
- **Old installs:** an older APK validates synced articles with its old rules, so articles of new kinds are skipped silently there instead of breaking it. ML articles still validate (unknown frontmatter fields are ignored).
- **Covers:** ML keeps its seeded random motifs (unchanged covers). Other subjects use a fixed motif (tree, bars, hex, servers, grid) with their track accents.
- **Placement Roadmap** is computed in the app from `content/roadmap.json`, which `build_index.py` flattens from `content/curriculum/*.json`. 6 months = P0 only; 12 months = P0 + P1; P2 are extras. Order respects prerequisites and interleaves subjects, with DSA running slightly ahead.
- **Curriculum authoring:** curricula were drafted in a compact line format and converted once to JSON; the JSON is now the only source of truth (`status` = planned / written / needs_review).
- **ML priority:** placement-relevant ML (primers and a handful of core papers) is P1; the rest is P2, because the target roles are product and infra engineering.
- **Practice problem links** use LeetCode slugs, CSES task ids and Codeforces problem ids that are well known; they were not all opened live from this sandbox. `tools/check_links.py` (when added) or a manual click-through should confirm them.

## v2: curriculum-driven pipeline

- **`pipeline/curriculum_generate.py` replaces discovery for the daily job.** It only writes planned curriculum entries whose prerequisites exist, by priority then path order, using `daily_mix` from `config.yaml` (default one per subject). No Semantic Scholar calls, so no 429 waits. `generate_article.py` stays for manual `--arxiv` runs.
- **Three passes plus a final check:** draft, critic (JSON rubric in `pipeline/prompts/critic.md`), revise, then a final critic score. Publishing needs: no validator errors, length within range, every runnable C++ block compiling, and a final score of at least `quality_threshold` (7.5). Otherwise the draft goes to `pipeline/drafts/<id>.md` (outside the app's content folders) and the entry becomes `needs_review`.
- **Metadata stays authoritative:** id, slug, subject, kind, track, order, priority, dates, cover seed and (for ML) the paper link come from the curriculum, never from the model. Prerequisites are filtered to written articles; unknown links and glossary marks are repaired.
- **Subject prompts are templates** (`pipeline/prompts/<subject>.md`) that pull in the shared writing guide, format spec and one exemplar article at run time, so the guide lives in one place. Each template's `exemplar:` line should point at the best article of that subject once it exists.
- **Gemini gets at most 2 retries** on transient errors (429/503) via a per-provider `max_retries`, then the run falls through to Groq.
- **The workflow has `timeout-minutes: 30`** and commits articles, curriculum status, drafts and `PROGRESS.md` together with a `[content]` message.
