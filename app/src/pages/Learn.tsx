import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Map as MapIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArticleRow, ProgressBar } from '../components/ArticleRow';
import { CoverArt, subjectMotif } from '../components/CoverArt';
import { EmptyState, TabHeader } from '../components/Headers';
import { Page } from '../components/Page';
import { ListSkeleton } from '../components/Skeleton';
import { haptic } from '../lib/native';
import { nextInPath, trackProgress } from '../lib/progress';
import { setPrefs, useStore } from '../lib/storage';
import type { Article, Subject, SubjectId } from '../lib/types';
import { useContent } from '../lib/useContent';

/**
 * Learn has two levels:
 *  1. /learn               subject cards (pick what to study)
 *  2. /learn?subject=dsa   that subject's roadmap: its tracks as a path you walk down
 */
export default function Learn() {
  const content = useContent();
  const [params] = useSearchParams();
  const fromUrl = params.get('subject');
  const subject = fromUrl ? content.subjectById.get(fromUrl as SubjectId) : undefined;

  if (!content.ready) {
    return (
      <Page>
        <TabHeader title="Learn" />
        <div className="px-5 pt-4">
          <ListSkeleton rows={6} />
        </div>
      </Page>
    );
  }
  return subject ? <SubjectRoadmap subject={subject} /> : <SubjectGrid />;
}

function SubjectGrid() {
  const content = useContent();
  const progress = useStore('progress');
  return (
    <Page>
      <TabHeader title="Learn" subtitle="Pick a subject to see its roadmap" />
      <div className="space-y-4 px-5 pb-6 pt-3">
        {content.subjects.map((sub) => (
          <SubjectBigCard key={sub.id} subject={sub} articles={content.pathInSubject(sub.id)} progress={progress} />
        ))}
        <Link to="/roadmap" className="press flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand-ink">
            <MapIcon size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold leading-snug">Placement Roadmap</span>
            <span className="block text-[12.5px] leading-snug text-muted">One 6 or 12 month plan mixing every subject</span>
          </span>
          <ArrowRight size={17} className="shrink-0 text-muted" />
        </Link>
      </div>
    </Page>
  );
}

function SubjectBigCard({ subject, articles, progress }: { subject: Subject; articles: Article[]; progress: ReturnType<typeof useStore<'progress'>> }) {
  const content = useContent();
  const p = trackProgress(articles, progress);
  const soon = subject.status === 'coming-soon';
  const parts = content.tracksInSubject(subject.id).length;
  return (
    <Link
      to={`/learn?subject=${subject.id}`}
      onClick={() => {
        haptic('selection');
        setPrefs({ subject: subject.id });
      }}
      className="press block overflow-hidden rounded-card border border-line bg-surface shadow-card"
    >
      <div className="relative">
        <CoverArt
          seed={`subject-${subject.id}`}
          accent={subject.accent}
          motif={subjectMotif(subject)}
          className={`aspect-[16/6] w-full ${soon ? 'opacity-60 grayscale-[35%]' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden />
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
          <h2 className="text-[20px] font-bold leading-tight tracking-[-0.01em] drop-shadow">{subject.title}</h2>
          <span className="shrink-0 rounded-full bg-black/35 px-2.5 py-1 text-[12px] font-semibold backdrop-blur">
            {soon ? 'Coming soon' : `${Math.round(p.pct * 100)}%`}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-[14px] leading-snug text-muted">{subject.subtitle || subject.description}</p>
        {!soon && (
          <>
            <div className="mt-3">
              <ProgressBar pct={p.pct} color={subject.accent} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12.5px] font-medium text-muted">
              <span>
                {p.done}/{p.total} read · {parts} parts
              </span>
              <span className="flex items-center gap-1 font-semibold" style={{ color: subject.accent }}>
                Open roadmap <ArrowRight size={14} />
              </span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

function SubjectRoadmap({ subject }: { subject: Subject }) {
  const content = useContent();
  const navigate = useNavigate();
  const progress = useStore('progress');
  const solved = useStore('problems');
  const path = content.pathInSubject(subject.id);
  const tracks = content.tracksInSubject(subject.id);
  const next = useMemo(() => nextInPath(path, progress), [path, progress]);
  const [open, setOpen] = useState<string | null>(null);
  const openId = open ?? next?.track ?? null;
  const overall = trackProgress(path, progress);
  const problems = path.flatMap((a) => (a.practice_problems ?? []).map((p) => ({ a, p })));
  const problemsSolved = problems.filter(({ a, p }) => solved[a.id]?.includes(p.url)).length;
  const soon = subject.status === 'coming-soon';

  return (
    <Page>
      <header className="chrome sticky top-0 z-30 border-b border-line bg-bg/[0.97] pt-safe backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[760px] items-center gap-1 px-2">
          <button onClick={() => navigate('/learn')} className="press flex h-11 w-11 items-center justify-center rounded-full" aria-label="All subjects">
            <ArrowLeft size={22} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold">{subject.title}</h1>
        </div>
      </header>

      {soon ? (
        <EmptyState
          icon={<Clock3 size={28} />}
          title={`${subject.title} is coming soon`}
          body={`${subject.description} You can already see where it fits in your plan.`}
          action={
            <Link to="/roadmap" className="press inline-flex h-11 items-center rounded-full bg-brand-btn px-5 text-[14px] font-semibold text-white">
              Open the Placement Roadmap
            </Link>
          }
        />
      ) : (
        <>
          <section className="relative mx-5 mt-4 overflow-hidden rounded-card shadow-card">
            <CoverArt seed={`subject-${subject.id}`} accent={subject.accent} motif={subjectMotif(subject)} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/30" aria-hidden />
            <div className="relative p-4 text-white">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/75">Your roadmap</p>
              <p className="mt-1 text-[22px] font-bold leading-tight">
                {overall.done} of {overall.total} read
              </p>
              <p className="mt-0.5 text-[13px] text-white/80">
                {tracks.length} parts{problems.length > 0 && ` · ${problemsSolved}/${problems.length} problems solved`}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(overall.pct * 100)}%` }} />
              </div>
              {next && (
                <Link
                  to={`/article/${next.id}`}
                  className="press mt-4 flex items-center gap-3 rounded-2xl bg-white/95 p-3 text-[#111]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-black/50">
                      {progress[next.id] ? 'Continue' : overall.done ? 'Up next' : 'Start here'}
                    </p>
                    <p className="line-clamp-2 font-serif text-[15.5px] font-semibold leading-snug">{next.title}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-btn text-white">
                    <ArrowRight size={17} />
                  </span>
                </Link>
              )}
            </div>
          </section>

          <ol className="relative mx-5 mt-6 pb-8">
            {/* the road: one vertical line joining every stop */}
            <span className="absolute bottom-8 left-[19px] top-5 w-0.5 bg-line" aria-hidden />
            {tracks.map((t, i) => {
              const articles = content.articlesInTrack(t.id);
              const p = trackProgress(articles, progress);
              const isOpen = openId === t.id;
              const complete = p.total > 0 && p.done === p.total;
              const current = next?.track === t.id;
              const mins = articles.reduce((m, a) => m + a.read_minutes, 0);
              return (
                <li key={t.id} className="relative pb-4 pl-[52px]">
                  <span
                    className={`absolute left-0 top-3 flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold ${
                      complete ? 'text-white' : current ? 'bg-bg' : 'border-2 border-line bg-bg text-muted'
                    }`}
                    style={complete ? { background: t.accent } : current ? { border: `2.5px solid ${t.accent}`, color: t.accent } : undefined}
                    aria-hidden
                  >
                    {complete ? <Check size={18} strokeWidth={3} /> : t.id === 'my-additions' ? '+' : i + 1}
                  </span>
                  <div
                    className={`overflow-hidden rounded-card border bg-surface ${current ? 'shadow-card' : ''}`}
                    style={{ borderColor: current ? t.accent : 'rgb(var(--border))' }}
                  >
                    <button
                      onClick={() => articles.length && setOpen(isOpen ? '' : t.id)}
                      className={`chrome flex w-full items-start gap-3 p-3.5 text-left ${articles.length ? '' : 'cursor-default opacity-60'}`}
                      aria-expanded={articles.length ? isOpen : undefined}
                    >
                      <div className="min-w-0 flex-1">
                        {current && (
                          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: t.accent }}>
                            You are here
                          </p>
                        )}
                        <p className="text-[15.5px] font-semibold leading-snug">{t.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">{t.subtitle}</p>
                        {articles.length > 0 ? (
                          <div className="mt-2.5 flex items-center gap-2.5">
                            <div className="flex-1">
                              <ProgressBar pct={p.pct} color={t.accent} />
                            </div>
                            <span className="shrink-0 text-[12px] font-medium text-muted">
                              {p.done}/{p.total} · {mins} min
                            </span>
                          </div>
                        ) : (
                          <p className="mt-1 text-[12px] font-medium text-muted">Coming soon</p>
                        )}
                      </div>
                      {articles.length > 0 && (
                        <ChevronDown size={18} className={`mt-1 shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && articles.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden border-t border-line"
                        >
                          <ol className="divide-y divide-line px-3.5">
                            {articles.map((a, j) => (
                              <li key={a.id}>
                                <ArticleRow article={a} index={j + 1} accent={t.accent} />
                              </li>
                            ))}
                          </ol>
                          <Link to={`/track/${t.id}`} className="press flex h-11 items-center gap-1 border-t border-line px-3.5 text-[13.5px] font-semibold text-brand-ink">
                            About this part <ArrowRight size={15} />
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Page>
  );
}
