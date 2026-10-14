/**
 * Fetch new or changed articles from the deployed site (GitHub Pages) so the
 * app gets new content without reinstalling. Silent when offline.
 */
import { BUNDLED_BASE, fetchJson } from './content';
import { parseAndValidate } from './frontmatter';
import { store, type RemoteState } from './storage';
import type { ContentIndex, IndexEntry, Track } from './types';

export const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const REMOTE_BASE = ((import.meta.env.VITE_CONTENT_BASE_URL as string | undefined) ?? '').replace(/\/$/, '');

export interface SyncPlan {
  download: IndexEntry[];
  keep: IndexEntry[];
  newIds: string[];
}

/** Decide which remote articles to download. Pure, so it is easy to test. */
export function planSync(bundled: IndexEntry[], prev: RemoteState, next: IndexEntry[]): SyncPlan {
  const bundledHash = new Map(bundled.map((e) => [e.id, e.hash]));
  const prevHash = new Map(prev.index.map((e) => [e.id, e.hash]));
  const download: IndexEntry[] = [];
  const keep: IndexEntry[] = [];
  const newIds: string[] = [];
  for (const e of next) {
    if (bundledHash.get(e.id) === e.hash) continue; // bundled copy is current
    if (prevHash.get(e.id) === e.hash && prev.articles[e.id]) keep.push(e);
    else download.push(e);
    if (!bundledHash.has(e.id) && !prevHash.has(e.id)) newIds.push(e.id);
  }
  return { download, keep, newIds };
}

export interface SyncResult {
  added: number;
  updated: number;
  skipped?: string;
}

let running: Promise<SyncResult> | null = null;

export function syncContent(opts: { force?: boolean; bundledVersion?: string | null } = {}): Promise<SyncResult> {
  running ??= doSync(opts).finally(() => {
    running = null;
  });
  return running;
}

async function doSync({ force = false }: { force?: boolean; bundledVersion?: string | null }): Promise<SyncResult> {
  const prefs = store.get('prefs');
  const prev = store.get('remote');
  if (!REMOTE_BASE) return { added: 0, updated: 0, skipped: 'no-remote' };
  if (!prefs.syncEnabled && !force) return { added: 0, updated: 0, skipped: 'disabled' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { added: 0, updated: 0, skipped: 'offline' };
  if (!force && prev.lastSyncAt && Date.now() - Date.parse(prev.lastSyncAt) < SYNC_INTERVAL_MS) {
    return { added: 0, updated: 0, skipped: 'recent' };
  }

  const now = new Date().toISOString();
  const remoteIndex = await fetchJson<ContentIndex>(`${REMOTE_BASE}/index.json`, { cache: 'no-store' });
  if (remoteIndex.content_version === prev.contentVersion) {
    store.update('remote', (r) => ({ ...r, lastSyncAt: now }));
    return { added: 0, updated: 0 };
  }

  const [bundled, remoteTracks] = await Promise.all([
    fetchJson<ContentIndex>(`${BUNDLED_BASE}index.json`),
    fetchJson<Track[]>(`${REMOTE_BASE}/tracks.json`, { cache: 'no-store' }).catch(() => undefined),
  ]);
  const plan = planSync(bundled.articles, prev, remoteIndex.articles);
  const trackIds = new Set([...(remoteTracks ?? []).map((t) => t.id), ...bundled.articles.map((a) => a.track)]);

  const articles: Record<string, string> = {};
  const index: IndexEntry[] = [];
  for (const e of plan.keep) {
    articles[e.id] = prev.articles[e.id];
    index.push(e);
  }
  const results = await Promise.allSettled(
    plan.download.map(async (e) => {
      const res = await fetch(`${REMOTE_BASE}/${e.path}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const raw = await res.text();
      const v = parseAndValidate(raw, { trackIds });
      if (!v.ok) throw new Error(`invalid ${e.id}`);
      return { e, raw };
    }),
  );
  let added = 0;
  let updated = 0;
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    articles[r.value.e.id] = r.value.raw;
    index.push(r.value.e);
    if (plan.newIds.includes(r.value.e.id)) added += 1;
    else updated += 1;
  }

  store.update('remote', () => ({
    contentVersion: remoteIndex.content_version,
    index,
    tracks: remoteTracks,
    articles,
    lastSyncAt: now,
  }));
  return { added, updated };
}
