/**
 * Local data, kept in IndexedDB (idb-keyval) with an in-memory mirror so
 * components can read synchronously. Every write goes through `update()`,
 * which notifies subscribers and persists in the background.
 */
import { useSyncExternalStore } from 'react';
import { createStore, getMany, set as idbSet, type UseStore } from 'idb-keyval';
import type { Frontmatter, IndexEntry, Track } from './types';

export type ThemePref = 'system' | 'light' | 'dark' | 'sepia';

export interface Prefs {
  theme: ThemePref;
  font: 'serif' | 'sans';
  fontSize: number;
  lineHeight: number;
  reminderTime: string | null; // "HH:MM" or null for off
  syncEnabled: boolean;
  onboarded: boolean;
}

export interface ProgressEntry {
  scrollPct: number;
  startedAt: string;
  lastReadAt: string;
  completedAt?: string;
  timeSpentSec: number;
}

export interface QuizResult {
  score: number;
  answers: number[];
  takenAt: string;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface Highlight {
  id: string;
  start: number;
  end: number;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
}

export interface Streak {
  current: number;
  best: number;
  lastActiveDate: string | null;
  /** Reading seconds for `day`, used for the 5-minute rule. */
  day: string | null;
  daySeconds: number;
}

export interface ImportedArticle {
  frontmatter: Frontmatter;
  body: string;
  importedAt: string;
}

export interface RemoteState {
  contentVersion: string | null;
  /** Only entries that differ from the bundled copy (new or changed). */
  index: IndexEntry[];
  tracks?: Track[];
  articles: Record<string, string>;
  lastSyncAt: string | null;
}

export interface Meta {
  lastUpdateCheck: string | null;
  dismissedVersion: string | null;
  completedTracks: string[];
}

export interface DB {
  prefs: Prefs;
  progress: Record<string, ProgressEntry>;
  quiz: Record<string, QuizResult>;
  saved: string[];
  highlights: Record<string, Highlight[]>;
  streak: Streak;
  imports: Record<string, ImportedArticle>;
  remote: RemoteState;
  meta: Meta;
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  font: 'serif',
  fontSize: 19,
  lineHeight: 1.7,
  reminderTime: null,
  syncEnabled: true,
  onboarded: false,
};

export const defaults = (): DB => ({
  prefs: { ...DEFAULT_PREFS },
  progress: {},
  quiz: {},
  saved: [],
  highlights: {},
  streak: { current: 0, best: 0, lastActiveDate: null, day: null, daySeconds: 0 },
  imports: {},
  remote: { contentVersion: null, index: [], articles: {}, lastSyncAt: null },
  meta: { lastUpdateCheck: null, dismissedVersion: null, completedTracks: [] },
});

export const KEYS = Object.keys(defaults()) as (keyof DB)[];

type Listener = () => void;

class Store {
  state: DB = defaults();
  ready = false;
  private listeners = new Map<keyof DB, Set<Listener>>();
  private idb: UseStore | undefined;
  private pending = new Map<keyof DB, ReturnType<typeof setTimeout>>();

  private db(): UseStore | undefined {
    if (typeof indexedDB === 'undefined') return undefined;
    this.idb ??= createStore('paperstack', 'kv');
    return this.idb;
  }

  async load(): Promise<void> {
    const db = this.db();
    if (db) {
      try {
        const values = await getMany(KEYS, db);
        const base = defaults();
        KEYS.forEach((k, i) => {
          const v = values[i];
          if (v === undefined) return;
          // Merge objects so new default fields appear after upgrades.
          const d = base[k];
          (this.state as unknown as Record<string, unknown>)[k] =
            d && typeof d === 'object' && !Array.isArray(d) && k !== 'progress' && k !== 'quiz' && k !== 'highlights' && k !== 'imports'
              ? { ...d, ...(v as object) }
              : v;
        });
      } catch (e) {
        console.warn('PaperStack: could not read local data', e);
      }
    }
    this.ready = true;
    KEYS.forEach((k) => this.emit(k));
  }

  get<K extends keyof DB>(key: K): DB[K] {
    return this.state[key];
  }

  update<K extends keyof DB>(key: K, fn: (prev: DB[K]) => DB[K]): DB[K] {
    const next = fn(this.state[key]);
    if (next === this.state[key]) return next;
    this.state = { ...this.state, [key]: next };
    this.emit(key);
    this.persist(key);
    return next;
  }

  replaceAll(data: Partial<DB>): void {
    const base = defaults();
    for (const k of KEYS) {
      const v = data[k] ?? base[k];
      this.state = { ...this.state, [k]: v };
      this.emit(k);
      this.persist(k, 0);
    }
  }

  subscribe(key: keyof DB, fn: Listener): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(fn);
    return () => set.delete(fn);
  }

  private emit(key: keyof DB) {
    this.listeners.get(key)?.forEach((l) => l());
  }

  private persist(key: keyof DB, delay = 250) {
    const db = this.db();
    if (!db) return;
    const t = this.pending.get(key);
    if (t) clearTimeout(t);
    this.pending.set(
      key,
      setTimeout(() => {
        this.pending.delete(key);
        idbSet(key, this.state[key], db).catch((e) => console.warn('PaperStack: save failed', e));
      }, delay),
    );
  }

  /** Write anything pending right away (used when the app goes to background). */
  flush(): void {
    const db = this.db();
    if (!db) return;
    for (const [key, t] of this.pending) {
      clearTimeout(t);
      idbSet(key, this.state[key], db).catch(() => undefined);
    }
    this.pending.clear();
  }
}

export const store = new Store();

export function useStore<K extends keyof DB>(key: K): DB[K] {
  return useSyncExternalStore(
    (cb) => store.subscribe(key, cb),
    () => store.get(key),
    () => store.get(key),
  );
}

export function setPrefs(patch: Partial<Prefs>): void {
  store.update('prefs', (p) => ({ ...p, ...patch }));
}

export function toggleSaved(id: string): boolean {
  let nowSaved = false;
  store.update('saved', (s) => {
    nowSaved = !s.includes(id);
    return nowSaved ? [id, ...s] : s.filter((x) => x !== id);
  });
  return nowSaved;
}

export function exportData(): string {
  const { remote: _remote, ...rest } = store.state;
  return JSON.stringify({ app: 'paperstack', version: 1, exportedAt: new Date().toISOString(), data: rest }, null, 2);
}

export function importData(json: string): void {
  const parsed = JSON.parse(json) as { app?: string; data?: Partial<DB> };
  if (parsed.app !== 'paperstack' || !parsed.data) throw new Error('This file is not a PaperStack backup.');
  store.replaceAll({ ...parsed.data, remote: store.state.remote });
}
