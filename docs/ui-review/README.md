# UI review: organisation pass

Branch: `claude/ui-reorg`. Status: **pending feedback**. Write feedback in `docs/ui-review/FEEDBACK.md` (or in chat) and the next session applies it.

- `overview.png`: before and after side by side (light). `overview-dark.png`: after, dark theme.
- `before/` and `after/`: every screen at 390x844, light and dark (`npm run screenshots`).

Article, Settings and Library are unchanged on purpose (owner: "those are good").

## What changed, in plain words

### Home
1. **One main card instead of three.** "Continue reading", the big "Up next" card and "Today's pick" are now a single card: continue the article you are reading, or start the next one. It has a progress bar and one button.
2. **Subjects are a 2-column grid** instead of a sideways carousel, so you see all six at once with their progress.
3. **"Up next in DSA"** shows just the next 3 articles of the subject you last opened on Learn, as compact rows with P0/P1/P2 badges.
4. **Placement Roadmap** is one slim row.
5. **"Recently added"** is 3 compact rows instead of 4 rows with large images.

### Learn
1. **Subject chips stick to the top** while you scroll.
2. **One slim summary strip** (read count, problems solved, progress bar, Continue) replaces the large progress-ring card.
3. **Tracks are a clean divided list**, not stacked cards. Each shows "x/y read · total minutes". Tap to expand.
4. **Article rows show a priority badge** (P0 highlighted), the kind and read time.
5. **Removed duplicated buttons**: each open track used to show its own Start and "About this part" buttons; now there is one Continue for the subject and a small "About this part" link.

### System
- One spacing scale, one section-label style, one progress bar style, at most two levels of cards. Details in `docs/ui/DESIGN.md`.
