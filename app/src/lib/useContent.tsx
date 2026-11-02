import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FALLBACK_SUBJECTS, fetchBundled, mergeCatalog, MY_ADDITIONS, sortPath, subjectOfTrack } from './content';
import { useStore } from './storage';
import type { Article, ContentIndex, Subject, SubjectId, Track } from './types';

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
  subjects: Subject[];
  subjectById: Map<string, Subject>;
  /** Tracks of one subject, in order ("My Additions" belongs to every subject's view of ML). */
  tracksInSubject: (subject: SubjectId) => Track[];
  /** Articles of one subject in path order. */
  pathInSubject: (subject: SubjectId) => Article[];
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
    const subjectMap = new Map<string, Subject>();
    for (const s of bundled?.index.subjects ?? FALLBACK_SUBJECTS) subjectMap.set(s.id, s);
    for (const s of remote.subjects ?? []) subjectMap.set(s.id, s);
    const subjects = [...subjectMap.values()].sort((a, b) => a.order - b.order);
    const path = sortPath(merged, tracks, subjects);
    const byId = new Map(path.map((a) => [a.id, a]));
    const byTrack = new Map<string, Article[]>();
    for (const a of path) {
      const list = byTrack.get(a.track) ?? [];
      list.push(a);
      byTrack.set(a.track, list);
    }
    const trackById = new Map(tracks.map((t) => [t.id, t]));
    const bySubject = new Map<string, Article[]>();
    for (const a of path) {
      const sid = a.track === MY_ADDITIONS.id ? a.subject ?? 'ml' : subjectOfTrack(trackById.get(a.track));
      const list = bySubject.get(sid) ?? [];
      list.push(a);
      bySubject.set(sid, list);
    }
    return {
      ready: !!bundled,
      error,
      tracks,
      path,
      byId,
      articlesInTrack: (id) => byTrack.get(id) ?? [],
      trackById,
      bundledVersion: bundled?.index.content_version ?? null,
      officialTrackIds,
      subjects,
      subjectById: subjectMap,
      tracksInSubject: (sid) =>
        tracks.filter((t) => (t.id === MY_ADDITIONS.id ? (bySubject.get(sid) ?? []).some((a) => a.track === t.id) : subjectOfTrack(t) === sid)),
      pathInSubject: (sid) => bySubject.get(sid) ?? [],
    };
  }, [bundled, remote.index, remote.tracks, remote.subjects, imports, error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContent(): ContentState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useContent must be used inside ContentProvider');
  return v;
}
