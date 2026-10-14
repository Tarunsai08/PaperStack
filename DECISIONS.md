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
- **Reminders** use inexact daily alarms (no exact-alarm permission), which is fine for a reading nudge.
