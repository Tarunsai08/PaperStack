# UI review: organisation pass

Branch: `claude/ui-reorg`. Status: **approved** (owner, 2026-11-03: "the design is good").

- `overview.png`: before and after side by side (light). `overview-dark.png`: after, dark theme.
- `before/` and `after/`: every screen at 390x844, light and dark (`npm run screenshots`).

Article, Settings and Library are unchanged on purpose (owner: "those are good").

## What changed, in plain words

### Home (round 2, after your feedback)
1. **One main card**: continue the article you are reading, or start the next one.
2. **"Recommended for you"**: a horizontal row with one next article from each subject (ML, DSA, CP, Famous, System Design), with cover art. Swipe sideways.
3. **Subjects grid** (2 columns) with progress for all six at once.
4. **"Up next in DSA"**: the next 3 articles of the subject you last opened (never repeating the recommended one).
5. **Placement Roadmap** row and **Recently added** (3 compact rows).

### Learn (round 2, redesigned)
1. **Learn now opens on big subject cards** (cover art, title, progress %, read count, "Open roadmap").
2. **Tapping a subject opens its roadmap**: a header card with your progress and the next article, then the subject's parts shown as **colour banner cards** (tinted card, accent strip, "PART 2 · You are here", read count, progress ring). The page opens at the part you are in. Approved by the owner.
3. **Tap any part** to expand its articles as compact rows (status, read time, P0/P1/P2 badge).
4. Back arrow returns to the subject cards. The Placement Roadmap (all subjects mixed) is linked at the bottom of the cards.

### System
- One spacing scale, one section-label style, one progress bar style, at most two levels of cards. Details in `docs/ui/DESIGN.md`.
