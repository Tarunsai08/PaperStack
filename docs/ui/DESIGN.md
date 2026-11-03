# PaperStack UI system

The owner's feedback: "everything is everywhere". The fix is **organisation, not a new look**: same brand orange (`#FF6719`), same fonts (Inter for UI, Literata for reading), same colours and themes. The owner approved the Article, Settings and Library screens as they are, so they are unchanged.

## Principles
1. **One primary action per screen.** Home has one primary card (continue or start). Learn has one Continue button for the whole subject.
2. **Progressive disclosure.** Show the next 3 items, not 14. Tracks on Learn are collapsed except the one you are in.
3. **At most two levels of cards.** A screen is a list of sections; a section may be one card; nothing inside a card is another card. Lists use dividers, not nested cards.
4. **One way to show progress.** A 4px bar (`ProgressBar`) for subjects and articles; a small ring only for the numbered track badges.
5. **One accent per subject**, from `content/subjects.json`, used for its dot, bar and track rings. Brand orange stays for primary buttons.
6. **No duplicated controls.** The per-track Start and Continue buttons on Learn were removed (the subject Continue button does that job). "About this part" is now a text link.

## Tokens
| Token | Value | Use |
|---|---|---|
| Spacing | 4, 8, 12, 16, 24 (Tailwind 1, 2, 3, 4, 6) | 24 between sections, 12 inside cards, 16 card padding; page gutter 20 |
| Type: screen title | 28-30 px bold | "Good morning", "Learn" |
| Type: section label | 12 px semibold uppercase, 0.08em tracking, muted | "SUBJECTS", "UP NEXT IN DSA" |
| Type: row title | 15-15.5 px medium | article and track rows |
| Type: meta | 12.5 px muted | "Primer · 5 min", "9/152 read" |
| Type: card title | 17 px Literata semibold | the primary card |
| Radius | `rounded-card` for cards, `rounded-full` for buttons and chips, `rounded-md` for badges | |
| Buttons | primary: brand fill, 36 px high on cards; chips: 36 px | touch targets stay at least 36 px with the row itself tappable |
| Priority badge | P0: brand tint; P1, P2: neutral | |

## Components
- `ArticleRow` (new): status icon (number, ring or tick), title, kind and read time, priority badge. Used on Home (Up next, Recently added) and Learn.
- `ProgressBar` (new): the single progress bar.
- `PrimaryCard` and `SubjectTile` (Home only): the one primary card, and the 2-column subject grid tile.
- `Label` (Home): section label with an optional action link.
- `RecommendCard` (Home): card in the horizontal recommendations row.
- `SubjectBigCard` and `SubjectRoadmap` (Learn): subject cards and the per-subject path.
- Removed: `SubjectCard` (horizontal carousel cards with cover art), the "Today's pick" card and the large "Up next" cover card.
- Unchanged: `TabBar` (4 items: Home, Learn, Search, Library), Article, Settings, Library, Search, Roadmap, Track screens.

## Screen structure
- **Home:** header (logo, streak, settings) → greeting → one primary card → "Recommended for you" (horizontal row, one next article per active subject) → subject grid (2 columns) → "Up next in <subject>" (3 rows, skipping recommended ones) → Placement Roadmap row → "Recently added" (3 rows).
- **Learn, level 1 (`/learn`):** big subject cards (cover art, progress, "Open roadmap") → Placement Roadmap link.
- **Learn, level 2 (`/learn?subject=<id>`):** back header → roadmap hero (progress, problems solved, next article) → the subject's tracks as a vertical path with numbered stops (tick when complete, accent ring and "You are here" for the current one); each stop expands into compact article rows.

## Tooling
- `npm run screenshots` (in `app/`): builds, serves, seeds realistic state and saves 390x844 PNGs in light and dark. Options: `--out <dir>`, `--no-build`, `--only home,learn-dsa`.
- `python3 tools/contact_sheet.py [names...]`: before/after contact sheet to `docs/ui-review/overview.png`.
