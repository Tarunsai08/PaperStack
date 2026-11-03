import { ArrowRight, Flame, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react';
import { useCallback, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArticleCover } from '../components/ArticleCover';
import { ArticleRow, ProgressBar } from '../components/ArticleRow';
import { Page } from '../components/Page';
import { PullToRefresh } from '../components/PullToRefresh';
import { CardSkeleton, ListSkeleton, Skeleton } from '../components/Skeleton';
import { syncContent } from '../lib/contentSync';
import { continueReading, effectiveStreak, nextInPath, trackProgress } from '../lib/progress';
import { useStore } from '../lib/storage';
import { toast } from '../lib/toast';
import type { Article, Subject } from '../lib/types';
import { useContent } from '../lib/useContent';

function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const content = useContent();
  const progress = useStore('progress');
  const streak = useStore('streak');
  const { path, trackById, subjects } = content;

  const cont = useMemo(() => continueReading(path, progress), [path, progress]);
  const next = useMemo(() => nextInPath(path, progress), [path, progress]);
  const upNext = next && next.id !== cont?.id ? next : path.find((a) => !progress[a.id]?.completedAt && a.id !== cont?.id);

  const primary = cont ?? upNext;
  const prefs = useStore('prefs');
  const focus = useMemo(() => {
    const active = subjects.filter((x) => x.status === 'active');
    return active.find((x) => x.id === prefs.subject) ?? (primary ? active.find((x) => x.id === primary.subject) : undefined) ?? active[0];
  }, [subjects, prefs.subject, primary]);
  const upNextList = useMemo(
    () => (focus ? content.pathInSubject(focus.id).filter((a) => !progress[a.id]?.completedAt && a.id !== primary?.id).slice(0, 3) : []),
    [content, focus, progress, primary?.id],
  );

  const recent = useMemo(() => {
    const skip = new Set([primary?.id, ...upNextList.map((a) => a.id)]);
    return [...path]
      .filter((a) => !skip.has(a.id))
      .sort(
        (a, b) =>
          sourceRank(b) - sourceRank(a) ||
          b.generated_at.localeCompare(a.generated_at) ||
          b.importance_score - a.importance_score,
      )
      .slice(0, 3);
  }, [path, primary?.id, upNextList]);

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
                  ? `${path.length} articles across ${subjects.filter((x) => x.status === 'active').length} subjects, written to get you placement ready.`
                  : `${done} of ${path.length} articles read. Keep going.`
                : 'Loading your library…'}
            </p>
          </div>
        </header>

        {!content.ready ? (
          <div className="space-y-6 px-5 pt-4">
            <Skeleton className="h-24 w-full rounded-card" />
            <CardSkeleton />
            <ListSkeleton rows={3} />
          </div>
        ) : (
          <div className="space-y-6 px-5 pb-6 pt-2">
            {primary && (
              <section>
                <Label>{cont ? 'Continue reading' : done === 0 ? 'Start here' : 'Up next'}</Label>
                <PrimaryCard article={primary} pct={progress[primary.id]?.scrollPct ?? 0} accent={trackById.get(primary.track)?.accent} />
              </section>
            )}

            <section>
              <Label>Subjects</Label>
              <div className="grid grid-cols-2 gap-3">
                {subjects.map((sub) => (
                  <SubjectTile key={sub.id} subject={sub} articles={content.pathInSubject(sub.id)} />
                ))}
              </div>
            </section>

            {upNextList.length > 0 && focus && (
              <section>
                <Label
                  action={
                    <Link to={`/learn?subject=${focus.id}`} className="press flex h-8 items-center gap-1 text-[13px] font-semibold text-brand-ink">
                      Open path <ArrowRight size={15} />
                    </Link>
                  }
                >
                  Up next in {focus.short}
                </Label>
                <div className="divide-y divide-line rounded-card border border-line bg-surface px-3">
                  {upNextList.map((a) => (
                    <ArticleRow key={a.id} article={a} index={a.track_order} accent={trackById.get(a.track)?.accent ?? focus.accent} />
                  ))}
                </div>
              </section>
            )}

            <Link to="/roadmap" className="press flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand-ink">
                <MapIcon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-snug">Placement Roadmap</span>
                <span className="block text-[12.5px] leading-snug text-muted">A 6 or 12 month plan across every subject</span>
              </span>
              <ArrowRight size={17} className="shrink-0 text-muted" />
            </Link>

            {recent.length > 0 && (
              <section>
                <Label>Recently added</Label>
                <div className="divide-y divide-line rounded-card border border-line bg-surface px-3">
                  {recent.map((a) => (
                    <ArticleRow
                      key={a.id}
                      article={a}
                      index={a.track_order}
                      accent={trackById.get(a.track)?.accent ?? '#FF6719'}
                      showTrack={trackById.get(a.track)?.title}
                    />
                  ))}
                </div>
              </section>
            )}
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

function Label({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="chrome mb-2 flex h-8 items-center justify-between">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</h2>
      {action}
    </div>
  );
}

/** The one primary card on Home: continue the article in progress, or start the next one. */
function PrimaryCard({ article, pct, accent = '#FF6719' }: { article: Article; pct: number; accent?: string }) {
  const { trackById } = useContent();
  const started = pct > 0.02;
  const left = Math.max(1, Math.ceil(article.read_minutes * (1 - pct)));
  return (
    <Link to={`/article/${article.id}`} className="press block rounded-card border border-line bg-surface p-3 shadow-card">
      <div className="flex items-center gap-3">
        <ArticleCover article={article} className="h-[72px] w-[72px] shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-muted">
            {trackById.get(article.track)?.title} · Part {article.track_order}
          </p>
          <p className="mt-0.5 line-clamp-2 font-serif text-[17px] font-semibold leading-snug">{article.title}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar pct={started ? pct : 0} color={accent} />
        </div>
        <span className="shrink-0 text-[12.5px] font-medium text-muted">{started ? `${left} min left` : `${article.read_minutes} min`}</span>
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-btn px-4 text-[14px] font-semibold text-white">
          {started ? 'Continue' : 'Start'} <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

/** Compact subject tile for the 2-column grid on Home. */
function SubjectTile({ subject, articles }: { subject: Subject; articles: Article[] }) {
  const progress = useStore('progress');
  const p = trackProgress(articles, progress);
  const soon = subject.status === 'coming-soon';
  return (
    <Link
      to={`/learn?subject=${subject.id}`}
      className={`press flex min-h-[92px] flex-col justify-between rounded-card border border-line bg-surface p-3 ${soon ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: subject.accent }} aria-hidden />
        <span className="line-clamp-2 text-[14.5px] font-semibold leading-snug">{subject.title}</span>
      </div>
      {soon ? (
        <span className="text-[12.5px] text-muted">Coming soon</span>
      ) : (
        <div>
          <p className="mb-1.5 text-[12.5px] text-muted">
            {p.done}/{p.total} read
          </p>
          <ProgressBar pct={p.pct} color={subject.accent} />
        </div>
      )}
    </Link>
  );
}
