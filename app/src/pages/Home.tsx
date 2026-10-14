import { ArrowRight, Flame, Settings as SettingsIcon } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { CoverArt } from '../components/CoverArt';
import { SectionTitle } from '../components/Headers';
import { Page } from '../components/Page';
import { PullToRefresh } from '../components/PullToRefresh';
import { CardSkeleton, ListSkeleton, Skeleton } from '../components/Skeleton';
import { TrackCard } from '../components/TrackCard';
import { syncContent } from '../lib/contentSync';
import { continueReading, effectiveStreak, localDay, nextInPath } from '../lib/progress';
import { useStore } from '../lib/storage';
import { toast } from '../lib/toast';
import type { Article } from '../lib/types';
import { useContent } from '../lib/useContent';

function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function dayNumber(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

export default function Home() {
  const content = useContent();
  const progress = useStore('progress');
  const streak = useStore('streak');
  const { path, trackById, tracks } = content;

  const cont = useMemo(() => continueReading(path, progress), [path, progress]);
  const next = useMemo(() => nextInPath(path, progress), [path, progress]);
  const upNext = next && next.id !== cont?.id ? next : path.find((a) => !progress[a.id]?.completedAt && a.id !== cont?.id);

  const featured = useMemo(() => {
    const skip = new Set([cont?.id, upNext?.id]);
    const pool = path
      .filter((a) => a.kind === 'paper' && !skip.has(a.id))
      .sort((a, b) => b.importance_score - a.importance_score)
      .slice(0, 14);
    const unread = pool.filter((a) => !progress[a.id]?.completedAt);
    const list = unread.length ? unread : pool;
    return list.length ? list[dayNumber(localDay()) % list.length] : undefined;
  }, [path, progress, cont?.id, upNext?.id]);

  const recent = useMemo(() => {
    const officialSkip = new Set([featured?.id]);
    return [...path]
      .filter((a) => !officialSkip.has(a.id))
      .sort(
        (a, b) =>
          sourceRank(b) - sourceRank(a) ||
          b.generated_at.localeCompare(a.generated_at) ||
          b.importance_score - a.importance_score,
      )
      .slice(0, 4);
  }, [path, featured?.id]);

  const done = path.filter((a) => progress[a.id]?.completedAt).length;
  const s = effectiveStreak(streak);

  const refresh = useCallback(async () => {
    try {
      const r = await syncContent({ force: true });
      if (r.skipped === 'no-remote') toast('Content sync is not set up for this build');
      else if (r.skipped === 'offline') toast("You're offline. Showing saved content.");
      else if (r.added || r.updated) toast(`${r.added} new, ${r.updated} updated`);
      else toast("You're up to date");
    } catch {
      toast("Couldn't reach the content server");
    }
  }, []);

  return (
    <Page>
      <PullToRefresh onRefresh={refresh}>
        <header className="chrome pt-safe">
          <div className="flex items-center justify-between px-5 pb-1 pt-5">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-[17px] font-bold tracking-[-0.01em]">PaperStack</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="flex h-9 items-center gap-1 rounded-full bg-surface-2 px-3 text-[14px] font-semibold"
                aria-label={`${s} day streak`}
              >
                <Flame size={16} className={s ? 'text-brand' : 'text-muted'} fill={s ? 'currentColor' : 'none'} />
                {s}
              </div>
              <Link
                to="/settings"
                className="press flex h-11 w-11 items-center justify-center rounded-full"
                aria-label="Settings"
              >
                <SettingsIcon size={21} />
              </Link>
            </div>
          </div>
          <div className="px-5 pb-2 pt-4">
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">{greeting()}</h1>
            <p className="mt-1 text-[15px] text-muted">
              {content.ready
                ? done === 0
                  ? `${path.length} articles take you from zero to modern AI.`
                  : `${done} of ${path.length} articles read. Keep going.`
                : 'Loading your library…'}
            </p>
          </div>
        </header>

        {!content.ready ? (
          <div className="space-y-8 px-5 pt-4">
            <Skeleton className="h-28 w-full rounded-card" />
            <CardSkeleton />
            <ListSkeleton rows={3} />
          </div>
        ) : (
          <div className="space-y-10 pt-4">
            {cont && <ContinueCard article={cont} pct={progress[cont.id]?.scrollPct ?? 0} accent={trackById.get(cont.track)?.accent} />}

            {upNext && (
              <section className="px-5">
                <p className="chrome mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {done === 0 && !cont ? 'Start here' : 'Up next on your path'}
                </p>
                <UpNextCard article={upNext} accent={trackById.get(upNext.track)?.accent} />
              </section>
            )}

            {featured && (
              <section className="px-5">
                <p className="chrome mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Today's pick</p>
                <ArticleCard article={featured} variant="featured" />
              </section>
            )}

            <section>
              <SectionTitle
                action={
                  <Link to="/learn" className="press flex h-11 items-center gap-1 text-[14px] font-semibold text-brand-ink">
                    See path <ArrowRight size={16} />
                  </Link>
                }
              >
                The learning path
              </SectionTitle>
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 scroll-px-5">
                {tracks.map((t) => (
                  <TrackCard key={t.id} track={t} articles={content.articlesInTrack(t.id)} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Recently added</SectionTitle>
              <div className="space-y-6 px-5">
                {recent.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="row" />
                ))}
              </div>
            </section>
          </div>
        )}
      </PullToRefresh>
    </Page>
  );
}

function sourceRank(a: Article): number {
  return a.source === 'imported' ? 2 : a.source === 'remote' ? 1 : 0;
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect x="10" y="14" width="40" height="44" rx="9" fill="#FF6719" opacity="0.35" />
      <rect x="14" y="8" width="40" height="44" rx="9" fill="#FF6719" />
      <path d="M27 40V20h9.5a6.5 6.5 0 0 1 0 13H27" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ContinueCard({ article, pct, accent = '#FF6719' }: { article: Article; pct: number; accent?: string }) {
  const left = Math.max(1, Math.ceil(article.read_minutes * (1 - pct)));
  return (
    <section className="px-5">
      <p className="chrome mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Continue reading</p>
      <Link to={`/article/${article.id}`} className="press flex items-center gap-4 rounded-card border border-line bg-surface p-3 shadow-card">
        <CoverArt seed={article.cover_seed} accent={accent} className="h-[76px] w-[76px] shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-serif text-[16.5px] font-semibold leading-snug">{article.title}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full" style={{ width: `${Math.round(pct * 100)}%`, background: accent }} />
            </div>
            <span className="shrink-0 text-[12.5px] font-medium text-muted">{left} min left</span>
          </div>
        </div>
      </Link>
    </section>
  );
}

function UpNextCard({ article, accent = '#FF6719' }: { article: Article; accent?: string }) {
  const { trackById } = useContent();
  return (
    <Link to={`/article/${article.id}`} className="press block overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <CoverArt seed={article.cover_seed} accent={accent} className="aspect-[16/8] w-full" />
      <div className="p-4">
        <p className="text-[12.5px] font-medium text-muted">
          {trackById.get(article.track)?.title} · Part {article.track_order} · {article.read_minutes} min
        </p>
        <h3 className="mt-1 font-serif text-[21px] font-semibold leading-tight">{article.title}</h3>
        <p className="mt-1 text-[15px] leading-snug text-muted">{article.subtitle}</p>
        <span className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-brand-btn px-5 text-[15px] font-semibold text-white">
          Start reading <ArrowRight size={17} />
        </span>
      </div>
    </Link>
  );
}
