/**
 * Checks GitHub Releases for a newer APK and exposes it to the UpdatePrompt.
 */
import { useSyncExternalStore } from 'react';
import { appVersion } from './native';
import { store } from './storage';

export const GITHUB_REPO = (import.meta.env.VITE_GITHUB_REPO as string | undefined) ?? '';
const DAY_MS = 24 * 60 * 60 * 1000;

export interface UpdateInfo {
  version: string;
  notes: string;
  apkUrl: string;
  pageUrl: string;
}

export function parseVersion(v: string): number[] {
  return v
    .trim()
    .replace(/^v/i, '')
    .split(/[.+-]/)
    .map((p) => parseInt(p, 10))
    .filter((n) => !Number.isNaN(n));
}

/** 1 if a > b, -1 if a < b, 0 if equal. "v1.0.10" > "1.0.9". */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}
interface Release {
  tag_name: string;
  body?: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export function releaseToUpdate(rel: Release, current: string): UpdateInfo | null {
  if (compareVersions(rel.tag_name, current) <= 0) return null;
  const apk = rel.assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
  return {
    version: rel.tag_name.replace(/^v/i, ''),
    notes: (rel.body ?? '').trim(),
    apkUrl: apk?.browser_download_url ?? rel.html_url,
    pageUrl: rel.html_url,
  };
}

let pending: UpdateInfo | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function usePendingUpdate(): UpdateInfo | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => pending,
    () => pending,
  );
}

export function clearPendingUpdate(dismiss = false): void {
  if (dismiss && pending) {
    const v = pending.version;
    store.update('meta', (m) => ({ ...m, dismissedVersion: v }));
  }
  pending = null;
  emit();
}

export type CheckResult = { status: 'update'; info: UpdateInfo } | { status: 'current' | 'skipped' | 'error'; message?: string };

export async function checkForUpdate({ force = false } = {}): Promise<CheckResult> {
  if (!GITHUB_REPO) return { status: 'skipped', message: 'No GitHub repository configured for this build.' };
  const meta = store.get('meta');
  if (!force && meta.lastUpdateCheck && Date.now() - Date.parse(meta.lastUpdateCheck) < DAY_MS) {
    return { status: 'skipped' };
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
    store.update('meta', (m) => ({ ...m, lastUpdateCheck: new Date().toISOString() }));
    if (res.status === 404) return { status: 'current' };
    if (!res.ok) return { status: 'error', message: `GitHub answered ${res.status}` };
    const info = releaseToUpdate((await res.json()) as Release, await appVersion());
    if (!info) return { status: 'current' };
    if (force || meta.dismissedVersion !== info.version) {
      pending = info;
      emit();
    }
    return { status: 'update', info };
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }
}
