/**
 * Content loading and merging.
 *
 * Three sources, one catalog:
 *   bundled  - shipped inside the APK / web build (public/content)
 *   remote   - downloaded later by contentSync (overrides bundled with the same id)
 *   imported - pasted by the user on the Import screen (never overrides the others)
 */
import { excerpt, readMinutes, wordCount } from './markdownText';
import type { ImportedArticle } from './storage';
import type { Article, ContentIndex, Frontmatter, IndexEntry, Track } from './types';

export const BUNDLED_BASE = `${import.meta.env.BASE_URL}content/`;

export const MY_ADDITIONS: Track = {
  id: 'my-additions',
  title: 'My Additions',
  subtitle: 'Articles you imported yourself',
  description: 'Articles you created with a chatbot or a local model and imported into PaperStack.',
  order: 99,
  accent: '#7C7C86',
};

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

export async function fetchBundled(): Promise<{ index: ContentIndex; tracks: Track[] }> {
  const [index, tracks] = await Promise.all([
    fetchJson<ContentIndex>(`${BUNDLED_BASE}index.json`),
    fetchJson<Track[]>(`${BUNDLED_BASE}tracks.json`),
  ]);
  return { index, tracks };
}

/** Tiny stable string hash (FNV-1a, hex). Good enough to detect changes. */
export function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function entryFromArticle(fm: Frontmatter, body: string, path: string): IndexEntry {
  const words = wordCount(body);
  return {
    ...fm,
    path,
    hash: hashString(body),
    word_count: words,
    read_minutes: readMinutes(words),
    excerpt: excerpt(body),
  };
}

export function mergeCatalog(
  bundled: IndexEntry[],
  remote: IndexEntry[],
  imports: Record<string, ImportedArticle>,
  trackIds: Set<string>,
): Article[] {
  const byId = new Map<string, Article>();
  for (const e of bundled) byId.set(e.id, { ...e, source: 'bundled' });
  for (const e of remote) byId.set(e.id, { ...e, source: 'remote' });
  let extra = 0;
  for (const imp of Object.values(imports)) {
    const fm = imp.frontmatter;
    if (byId.has(fm.id)) continue;
    const track = trackIds.has(fm.track) ? fm.track : MY_ADDITIONS.id;
    extra += 1;
    byId.set(fm.id, {
      ...entryFromArticle(fm, imp.body, `imported/${fm.id}.md`),
      track,
      // Imported articles go after the official ones in their track.
      track_order: 1000 + (fm.track_order ?? extra),
      source: 'imported',
    });
  }
  return [...byId.values()];
}

export function sortPath(articles: Article[], tracks: Track[]): Article[] {
  const order = new Map(tracks.map((t) => [t.id, t.order]));
  return [...articles].sort(
    (a, b) =>
      (order.get(a.track) ?? 99) - (order.get(b.track) ?? 99) ||
      a.track_order - b.track_order ||
      a.title.localeCompare(b.title),
  );
}

const bodyCache = new Map<string, string>();

export interface BodySources {
  imports: Record<string, ImportedArticle>;
  remoteArticles: Record<string, string>;
}

export async function loadArticleBody(article: Article, src: BodySources): Promise<string> {
  if (article.source === 'imported') return src.imports[article.id]?.body ?? '';
  // The YAML parser is loaded on demand so it stays out of the start-up bundle.
  const { parseArticle } = await import('./frontmatter');
  if (article.source === 'remote' && src.remoteArticles[article.id]) {
    return parseArticle(src.remoteArticles[article.id]).body;
  }
  const key = `${article.path}#${article.hash}`;
  const cached = bodyCache.get(key);
  if (cached) return cached;
  const res = await fetch(`${BUNDLED_BASE}${article.path}`);
  if (!res.ok) throw new Error(`Could not load ${article.path}`);
  const body = parseArticle(await res.text()).body;
  bodyCache.set(key, body);
  return body;
}

/** Articles that share topics with `a`, best first. */
export function relatedArticles(a: Article, all: Article[], exclude: string[] = [], limit = 3): Article[] {
  const topics = new Set(a.topics);
  const skip = new Set([a.id, ...exclude]);
  return all
    .filter((x) => !skip.has(x.id))
    .map((x) => {
      const overlap = x.topics.filter((t) => topics.has(t)).length;
      const linked = x.prerequisites.includes(a.id) || a.prerequisites.includes(x.id) ? 1.5 : 0;
      const sameTrack = x.track === a.track ? 0.5 : 0;
      return { x, score: overlap + linked + sameTrack };
    })
    .filter((s) => s.score > 0.5)
    .sort((p, q) => q.score - p.score || q.x.importance_score - p.x.importance_score)
    .slice(0, limit)
    .map((s) => s.x);
}
