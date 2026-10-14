import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchBundled, mergeCatalog, MY_ADDITIONS, sortPath } from './content';
import { useStore } from './storage';
import type { Article, ContentIndex, Track } from './types';

export interface ContentState {
  ready: boolean;
  error: string | null;
  tracks: Track[];
  /** Every article in learning-path order. */
  path: Article[];
  byId: Map<string, Article>;
  articlesInTrack: (trackId: string) => Article[];
  trackById: Map<string, Track>;
  bundledVersion: string | null;
  officialTrackIds: Set<string>;
}

const Ctx = createContext<ContentState | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [bundled, setBundled] = useState<{ index: ContentIndex; tracks: Track[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const remote = useStore('remote');
  const imports = useStore('imports');

  useEffect(() => {
    let alive = true;
    fetchBundled()
      .then((b) => alive && setBundled(b))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<ContentState>(() => {
    const trackMap = new Map((bundled?.tracks ?? []).map((t) => [t.id, t]));
    for (const t of remote.tracks ?? []) trackMap.set(t.id, t);
    const baseTracks = bundled ? [...trackMap.values()].sort((a, b) => a.order - b.order) : [];
    const officialTrackIds = new Set(baseTracks.map((t) => t.id));
    const merged = bundled ? mergeCatalog(bundled.index.articles, remote.index, imports, officialTrackIds) : [];
    const hasAdditions = merged.some((a) => a.track === MY_ADDITIONS.id);
    const tracks = hasAdditions ? [...baseTracks, MY_ADDITIONS] : baseTracks;
    const path = sortPath(merged, tracks);
    const byId = new Map(path.map((a) => [a.id, a]));
    const byTrack = new Map<string, Article[]>();
    for (const a of path) {
      const list = byTrack.get(a.track) ?? [];
      list.push(a);
      byTrack.set(a.track, list);
    }
    return {
      ready: !!bundled,
      error,
      tracks,
      path,
      byId,
      articlesInTrack: (id) => byTrack.get(id) ?? [],
      trackById: new Map(tracks.map((t) => [t.id, t])),
      bundledVersion: bundled?.index.content_version ?? null,
      officialTrackIds,
    };
  }, [bundled, remote.index, remote.tracks, imports, error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContent(): ContentState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useContent must be used inside ContentProvider');
  return v;
}
