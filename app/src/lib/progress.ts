import { store, type ProgressEntry, type Streak } from './storage';
import type { Article, Track } from './types';

export const STREAK_MIN_SECONDS = 5 * 60;

/** Local calendar date as YYYY-MM-DD. */
export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y, m - 1, d + n));
}

/** Count today as an active day. Pure. */
export function markActive(s: Streak, today: string): Streak {
  if (s.lastActiveDate === today) return s;
  const current = s.lastActiveDate === addDays(today, -1) ? s.current + 1 : 1;
  return { ...s, current, best: Math.max(s.best, current), lastActiveDate: today };
}

/** Add reading time; the day counts once 5 minutes are reached. Pure. */
export function addReadingTime(s: Streak, today: string, seconds: number): Streak {
  const daySeconds = (s.day === today ? s.daySeconds : 0) + seconds;
  const next = { ...s, day: today, daySeconds };
  return daySeconds >= STREAK_MIN_SECONDS ? markActive(next, today) : next;
}

/** The streak shown to the user: it lapses if yesterday was missed. */
export function effectiveStreak(s: Streak, today: string = localDay()): number {
  if (!s.lastActiveDate) return 0;
  if (s.lastActiveDate === today || s.lastActiveDate === addDays(today, -1)) return s.current;
  return 0;
}

export type ArticleStatus = 'unread' | 'in-progress' | 'completed';

export function statusOf(p: ProgressEntry | undefined): ArticleStatus {
  if (!p) return 'unread';
  if (p.completedAt) return 'completed';
  return 'in-progress';
}

export function recordReading(id: string, seconds: number, scrollPct?: number): void {
  const now = new Date().toISOString();
  store.update('progress', (all) => {
    const prev = all[id];
    const entry: ProgressEntry = {
      scrollPct: scrollPct ?? prev?.scrollPct ?? 0,
      startedAt: prev?.startedAt ?? now,
      lastReadAt: now,
      completedAt: prev?.completedAt,
      timeSpentSec: (prev?.timeSpentSec ?? 0) + seconds,
    };
    return { ...all, [id]: entry };
  });
  if (seconds > 0) store.update('streak', (s) => addReadingTime(s, localDay(), seconds));
}

export function saveScroll(id: string, scrollPct: number): void {
  store.update('progress', (all) => {
    const prev = all[id];
    const now = new Date().toISOString();
    if (prev && Math.abs(prev.scrollPct - scrollPct) < 0.005) return all;
    return {
      ...all,
      [id]: {
        scrollPct,
        startedAt: prev?.startedAt ?? now,
        lastReadAt: now,
        completedAt: prev?.completedAt,
        timeSpentSec: prev?.timeSpentSec ?? 0,
      },
    };
  });
}

/** Mark complete. Returns true if this was the first completion. */
export function completeArticle(id: string): boolean {
  let first = false;
  const now = new Date().toISOString();
  store.update('progress', (all) => {
    const prev = all[id];
    if (prev?.completedAt) return all;
    first = true;
    return {
      ...all,
      [id]: {
        scrollPct: prev?.scrollPct ?? 1,
        startedAt: prev?.startedAt ?? now,
        lastReadAt: now,
        completedAt: now,
        timeSpentSec: prev?.timeSpentSec ?? 0,
      },
    };
  });
  store.update('streak', (s) => markActive(s, localDay()));
  return first;
}

export function resetArticle(id: string): void {
  store.update('progress', (all) => {
    const { [id]: _drop, ...rest } = all;
    return rest;
  });
}

export interface TrackProgress {
  total: number;
  done: number;
  pct: number;
}

export function trackProgress(articles: Article[], progress: Record<string, ProgressEntry>): TrackProgress {
  const total = articles.length;
  const done = articles.filter((a) => progress[a.id]?.completedAt).length;
  return { total, done, pct: total ? done / total : 0 };
}

/** First unfinished article in path order (prefers one already in progress). */
export function nextInPath(path: Article[], progress: Record<string, ProgressEntry>): Article | undefined {
  return path.find((a) => !progress[a.id]?.completedAt);
}

export function continueReading(path: Article[], progress: Record<string, ProgressEntry>): Article | undefined {
  return path
    .filter((a) => progress[a.id] && !progress[a.id].completedAt && progress[a.id].scrollPct > 0.02)
    .sort((a, b) => progress[b.id].lastReadAt.localeCompare(progress[a.id].lastReadAt))[0];
}

/** Returns the track id if completing `id` just finished its whole track. */
export function justFinishedTrack(
  id: string,
  articles: Article[],
  tracks: Track[],
  progress: Record<string, ProgressEntry>,
): Track | undefined {
  const art = articles.find((a) => a.id === id);
  if (!art) return undefined;
  const inTrack = articles.filter((a) => a.track === art.track);
  if (inTrack.length && inTrack.every((a) => progress[a.id]?.completedAt)) {
    return tracks.find((t) => t.id === art.track);
  }
  return undefined;
}
