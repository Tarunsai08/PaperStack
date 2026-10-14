import { Search as SearchIcon, X } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { EmptyState } from '../components/Headers';
import { Page } from '../components/Page';
import { ListSkeleton } from '../components/Skeleton';
import { haptic } from '../lib/native';
import { applyFilters, buildSearchIndex, search, type SearchFilters } from '../lib/search';
import { useStore } from '../lib/storage';
import { useContent } from '../lib/useContent';

function Chip({ active, onClick, children, dot }: { active: boolean; onClick: () => void; children: string; dot?: string }) {
  return (
    <button
      onClick={() => {
        haptic('selection');
        onClick();
      }}
      aria-pressed={active}
      className={`press flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors ${
        active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink'
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}

export default function Search() {
  const content = useContent();
  const progress = useStore('progress');
  const [q, setQ] = useState('');
  const query = useDeferredValue(q);
  const [f, setF] = useState<SearchFilters>({});
  const index = useMemo(() => buildSearchIndex(content.path), [content.path]);
  const hasFilters = !!(f.track || f.difficulty || f.kind || f.unreadOnly);

  const results = useMemo(() => {
    const base = query.trim() ? search(index, content.byId, query) : hasFilters ? content.path : [];
    return applyFilters(base, f, (id) => !!progress[id]?.completedAt);
  }, [query, index, content.byId, content.path, f, hasFilters, progress]);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of content.path) for (const t of a.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18);
  }, [content.path]);

  const toggle = <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) =>
    setF((p) => ({ ...p, [k]: p[k] === v ? undefined : v }));

  return (
    <Page>
      <div className="chrome sticky top-0 z-30 bg-bg/95 backdrop-blur-xl pt-safe">
        <div className="px-5 pb-3 pt-5">
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.02em]">Search</h1>
          <div className="mt-3 flex h-12 items-center gap-2 rounded-2xl bg-surface-2 px-4 ring-brand/60 focus-within:ring-2">
            <SearchIcon size={19} className="shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Papers, ideas, people, terms…"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted focus-visible:outline-none"
              aria-label="Search articles"
              enterKeyHint="search"
              inputMode="search"
              autoComplete="off"
              type="text"
            />
            {q && (
              <button onClick={() => setQ('')} className="press -mr-2 flex h-10 w-10 items-center justify-center text-muted" aria-label="Clear search">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-2">
          <Chip active={!!f.unreadOnly} onClick={() => toggle('unreadOnly', true)}>Unread</Chip>
          <Chip active={f.kind === 'paper'} onClick={() => toggle('kind', 'paper')}>Papers</Chip>
          <Chip active={f.kind === 'primer'} onClick={() => toggle('kind', 'primer')}>Primers</Chip>
          <Chip active={f.difficulty === 'beginner'} onClick={() => toggle('difficulty', 'beginner')}>Beginner</Chip>
          <Chip active={f.difficulty === 'intermediate'} onClick={() => toggle('difficulty', 'intermediate')}>Intermediate</Chip>
          <Chip active={f.difficulty === 'advanced'} onClick={() => toggle('difficulty', 'advanced')}>Advanced</Chip>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line px-5 pb-3">
          {content.tracks.map((t) => (
            <Chip key={t.id} active={f.track === t.id} onClick={() => toggle('track', t.id)} dot={t.accent}>
              {t.title}
            </Chip>
          ))}
        </div>
      </div>

      {!content.ready ? (
        <div className="px-5 pt-6">
          <ListSkeleton />
        </div>
      ) : !query.trim() && !hasFilters ? (
        <section className="px-5 pt-6">
          <p className="chrome text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Browse by topic</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map(([t, n]) => (
              <button
                key={t}
                onClick={() => setQ(t)}
                className="press flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[14px] font-medium"
              >
                {t}
                <span className="text-[12px] text-muted">{n}</span>
              </button>
            ))}
          </div>
        </section>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title="Nothing matches yet"
          body="Try a broader word, a paper name like 'ResNet', or clear a filter."
          action={
            hasFilters ? (
              <button onClick={() => setF({})} className="press h-11 rounded-full border border-line px-5 text-[14px] font-semibold">
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <section className="px-5 pt-5">
          <p className="chrome mb-4 text-[13px] font-medium text-muted">
            {results.length} article{results.length === 1 ? '' : 's'}
          </p>
          <div className="space-y-6">
            {results.map((a) => (
              <ArticleCard key={a.id} article={a} variant="row" />
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
