import MiniSearch from 'minisearch';
import type { Article } from './types';

export interface SearchFilters {
  track?: string | null;
  difficulty?: string | null;
  kind?: string | null;
  unreadOnly?: boolean;
}

interface Doc {
  id: string;
  title: string;
  subtitle: string;
  topics: string;
  glossary: string;
  excerpt: string;
  paper: string;
}

export function buildSearchIndex(articles: Article[]): MiniSearch<Doc> {
  const ms = new MiniSearch<Doc>({
    fields: ['title', 'subtitle', 'topics', 'glossary', 'excerpt', 'paper'],
    storeFields: ['id'],
    searchOptions: {
      boost: { title: 3, paper: 2.5, topics: 2, subtitle: 1.5, glossary: 1.2 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
    },
  });
  ms.addAll(
    articles.map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: a.subtitle,
      topics: a.topics.join(' '),
      glossary: a.glossary.map((g) => `${g.term} ${g.definition}`).join(' '),
      excerpt: a.excerpt,
      paper: [a.paper_title, ...(a.authors ?? []), a.year, a.venue].filter(Boolean).join(' '),
    })),
  );
  return ms;
}

export function applyFilters(
  list: Article[],
  f: SearchFilters,
  isCompleted: (id: string) => boolean,
): Article[] {
  return list.filter(
    (a) =>
      (!f.track || a.track === f.track) &&
      (!f.difficulty || a.difficulty === f.difficulty) &&
      (!f.kind || a.kind === f.kind) &&
      (!f.unreadOnly || !isCompleted(a.id)),
  );
}

export function search(
  index: MiniSearch<Doc>,
  byId: Map<string, Article>,
  query: string,
): Article[] {
  const q = query.trim();
  if (!q) return [];
  let hits = index.search(q);
  if (!hits.length) hits = index.search(q, { combineWith: 'OR' });
  return hits.map((h) => byId.get(h.id as string)).filter((a): a is Article => !!a);
}
