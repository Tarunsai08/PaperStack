import { describe, expect, it } from 'vitest';
import { mergeCatalog, relatedArticles, sortPath } from './content';
import { planSync } from './contentSync';
import { addReadingTime, effectiveStreak, markActive, nextInPath } from './progress';
import type { ImportedArticle, RemoteState, Streak } from './storage';
import type { Article, IndexEntry, Track } from './types';
import { compareVersions, releaseToUpdate } from './updateCheck';

const entry = (id: string, over: Partial<IndexEntry> = {}): IndexEntry => ({
  id,
  kind: 'paper',
  slug: id,
  title: id,
  subtitle: '',
  track: 'a',
  track_order: 1,
  prerequisites: [],
  difficulty: 'beginner',
  read_minutes: 5,
  topics: ['x'],
  glossary: [],
  quiz: [],
  cover_seed: id,
  generated_by: 'test',
  generated_at: '2026-10-14',
  importance_score: 0.5,
  path: `papers/${id}.md`,
  hash: 'h1',
  word_count: 100,
  excerpt: '',
  ...over,
});

const tracks: Track[] = [
  { id: 'a', title: 'A', subtitle: '', order: 0, accent: '#000' },
  { id: 'b', title: 'B', subtitle: '', order: 1, accent: '#000' },
];

describe('mergeCatalog', () => {
  const bundled = [entry('paper-one'), entry('paper-two', { track_order: 2 })];
  const imp = (id: string, track = 'a'): ImportedArticle => ({
    frontmatter: { ...entry(id), track },
    body: '## The hook\n\nHello world.',
    importedAt: '2026-10-14T00:00:00Z',
  });

  it('lets remote content override bundled content with the same id', () => {
    const merged = mergeCatalog(bundled, [entry('paper-two', { title: 'New title', hash: 'h2' })], {}, new Set(['a']));
    const two = merged.find((a) => a.id === 'paper-two')!;
    expect(two.title).toBe('New title');
    expect(two.source).toBe('remote');
    expect(merged.find((a) => a.id === 'paper-one')!.source).toBe('bundled');
  });

  it('never lets an import override official content', () => {
    const merged = mergeCatalog(bundled, [], { 'paper-one': imp('paper-one') }, new Set(['a']));
    expect(merged.find((a) => a.id === 'paper-one')!.source).toBe('bundled');
  });

  it('puts imports with unknown tracks into My Additions, after official articles', () => {
    const merged = mergeCatalog(bundled, [], { 'paper-mine': imp('paper-mine', 'nope') }, new Set(['a']));
    const mine = merged.find((a) => a.id === 'paper-mine')!;
    expect(mine.track).toBe('my-additions');
    expect(mine.track_order).toBeGreaterThan(1000);
    expect(mine.source).toBe('imported');
  });

  it('sorts by track order, then track_order', () => {
    const list = [entry('x', { track: 'b', track_order: 1 }), entry('y', { track: 'a', track_order: 2 }), entry('z', { track: 'a', track_order: 1 })];
    const sorted = sortPath(list.map((e) => ({ ...e, source: 'bundled' as const })), tracks);
    expect(sorted.map((a) => a.id)).toEqual(['z', 'y', 'x']);
  });
});

describe('relatedArticles', () => {
  it('prefers shared topics and prerequisite links', () => {
    const base: Article = { ...entry('p1', { topics: ['attention'] }), source: 'bundled' };
    const all: Article[] = [
      base,
      { ...entry('p2', { topics: ['attention'], prerequisites: ['p1'] }), source: 'bundled' },
      { ...entry('p3', { topics: ['gans'], track: 'b' }), source: 'bundled' },
    ];
    expect(relatedArticles(base, all).map((a) => a.id)).toEqual(['p2']);
  });
});

describe('planSync', () => {
  const prev: RemoteState = { contentVersion: 'v1', index: [entry('paper-r', { hash: 'r1' })], articles: { 'paper-r': 'raw' }, lastSyncAt: null };

  it('skips articles identical to the bundled copy', () => {
    const plan = planSync([entry('paper-b', { hash: 'b1' })], prev, [entry('paper-b', { hash: 'b1' })]);
    expect(plan.download).toHaveLength(0);
    expect(plan.keep).toHaveLength(0);
  });

  it('downloads changed and new articles and reports only new ids as new', () => {
    const plan = planSync([entry('paper-b', { hash: 'b1' })], prev, [
      entry('paper-b', { hash: 'b2' }),
      entry('paper-n', { hash: 'n1' }),
      entry('paper-r', { hash: 'r1' }),
    ]);
    expect(plan.download.map((e) => e.id).sort()).toEqual(['paper-b', 'paper-n']);
    expect(plan.keep.map((e) => e.id)).toEqual(['paper-r']);
    expect(plan.newIds).toEqual(['paper-n']);
  });
});

describe('versions', () => {
  it('compares semantic versions numerically', () => {
    expect(compareVersions('v1.0.10', '1.0.9')).toBe(1);
    expect(compareVersions('1.0.9', 'v1.0.10')).toBe(-1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.1.0', '1.0.99')).toBe(1);
  });

  it('builds update info only for newer releases, preferring the APK asset', () => {
    const rel = {
      tag_name: 'v1.0.42',
      body: 'notes',
      html_url: 'https://github.com/o/r/releases/tag/v1.0.42',
      assets: [
        { name: 'checksums.txt', browser_download_url: 'https://x/checksums.txt' },
        { name: 'PaperStack-1.0.42.apk', browser_download_url: 'https://x/PaperStack-1.0.42.apk' },
      ],
    };
    expect(releaseToUpdate(rel, '1.0.42')).toBeNull();
    expect(releaseToUpdate(rel, '1.0.41')).toEqual({
      version: '1.0.42',
      notes: 'notes',
      apkUrl: 'https://x/PaperStack-1.0.42.apk',
      pageUrl: rel.html_url,
    });
  });
});

describe('streaks', () => {
  const empty: Streak = { current: 0, best: 0, lastActiveDate: null, day: null, daySeconds: 0 };

  it('counts consecutive days and resets after a gap', () => {
    let s = markActive(empty, '2026-10-01');
    s = markActive(s, '2026-10-02');
    s = markActive(s, '2026-10-02');
    expect(s.current).toBe(2);
    s = markActive(s, '2026-10-05');
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
  });

  it('needs five minutes of reading for a day to count', () => {
    let s = addReadingTime(empty, '2026-10-01', 120);
    expect(s.lastActiveDate).toBeNull();
    s = addReadingTime(s, '2026-10-01', 200);
    expect(s.lastActiveDate).toBe('2026-10-01');
    expect(s.current).toBe(1);
  });

  it('crosses month boundaries', () => {
    const s = markActive(markActive(empty, '2026-09-30'), '2026-10-01');
    expect(s.current).toBe(2);
  });

  it('shows zero once a day is missed', () => {
    const s = markActive(empty, '2026-10-01');
    expect(effectiveStreak(s, '2026-10-02')).toBe(1);
    expect(effectiveStreak(s, '2026-10-03')).toBe(0);
  });
});

describe('nextInPath', () => {
  it('returns the first article that is not completed', () => {
    const path = ['a', 'b', 'c'].map((id) => ({ ...entry(id), source: 'bundled' as const }));
    const progress = { a: { scrollPct: 1, startedAt: '', lastReadAt: '', completedAt: 'x', timeSpentSec: 0 } };
    expect(nextInPath(path, progress)?.id).toBe('b');
  });
});
