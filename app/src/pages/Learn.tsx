import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Clock3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState, TabHeader } from '../components/Headers';
import { Page } from '../components/Page';
import { ProgressRing } from '../components/ProgressRing';
import { ListSkeleton } from '../components/Skeleton';
import { ArticleRow, ProgressBar } from '../components/ArticleRow';
import { nextInPath, trackProgress } from '../lib/progress';
import { haptic } from '../lib/native';
import { setPrefs, useStore } from '../lib/storage';
import type { SubjectId } from '../lib/types';
import { useContent } from '../lib/useContent';

export default function Learn() {
  const content = useContent();
  const progress = useStore('progress');
  const prefs = useStore('prefs');
  const solved = useStore('problems');
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get('subject');
  const subjectId = (content.subjectById.has(fromUrl ?? '') ? fromUrl : content.subjectById.has(prefs.subject) ? prefs.subject : 'ml') as SubjectId;
  const subject = content.subjectById.get(subjectId);
  const path = content.pathInSubject(subjectId);
  const tracks = content.tracksInSubject(subjectId);
  const next = useMemo(() => nextInPath(path, progress), [path, progress]);
  const [open, setOpen] = useState<string | null>(() => null);
  const openId = open ?? next?.track ?? tracks[0]?.id ?? null;
  const overall = trackProgress(path, progress);
  const problems = path.flatMap((a) => (a.practice_problems ?? []).map((p) => ({ a, p })));
  const problemsSolved = problems.filter(({ a, p }) => solved[a.id]?.includes(p.url)).length;

  const pick = (id: SubjectId) => {
    haptic('selection');
    setPrefs({ subject: id });
    setOpen(null);
    setParams({ subject: id }, { replace: true });
  };

  return (
    <Page>
      <TabHeader title="Learn" subtitle={subject ? subject.title : 'Your learning path'} />
      {content.ready && (
        <div className="chrome sticky top-0 z-20 border-b border-line bg-bg/[0.97] pt-safe backdrop-blur-xl">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-2" role="tablist" aria-label="Subjects">
            {content.subjects.map((sub) => {
              const active = sub.id === subjectId;
              return (
                <button
                  key={sub.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => pick(sub.id)}
                  className={`press flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors ${
                    active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: sub.accent }} aria-hidden />
                  {sub.short}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {!content.ready ? (
        <div className="px-5 pt-4">
          <ListSkeleton rows={6} />
        </div>
      ) : subject?.status === 'coming-soon' ? (
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
          <section className="chrome mx-5 mt-4 rounded-card border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug">
                  {overall.done} of {overall.total} read
                  <span className="font-normal text-muted"> · {tracks.length} parts</span>
                </p>
                {problems.length > 0 && (
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {problemsSolved}/{problems.length} practice problems solved
                  </p>
                )}
              </div>
              {next && (
                <Link
                  to={`/article/${next.id}`}
                  className="press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-btn px-4 text-[14px] font-semibold text-white"
                >
                  {progress[next.id] ? 'Continue' : overall.done ? 'Next' : 'Start'} <ArrowRight size={15} />
                </Link>
              )}
            </div>
            <div className="mt-3">
              <ProgressBar pct={overall.pct} color={subject?.accent} />
            </div>
          </section>

          <ol className="mt-4 divide-y divide-line border-y border-line">
            {tracks.map((t, i) => {
              const articles = content.articlesInTrack(t.id);
              const p = trackProgress(articles, progress);
              const isOpen = openId === t.id;
              const mins = articles.reduce((m, a) => m + a.read_minutes, 0);
              return (
                <li key={t.id}>
                  <button
                    onClick={() => articles.length && setOpen(isOpen ? '' : t.id)}
                    className={`chrome flex w-full items-center gap-3 px-5 py-3.5 text-left ${articles.length ? '' : 'cursor-default opacity-60'}`}
                    aria-expanded={articles.length ? isOpen : undefined}
                    aria-disabled={!articles.length}
                  >
                    <ProgressRing pct={p.pct} size={36} stroke={3} color={t.accent} label={`${t.title} progress`}>
                      <span className="text-[12px] font-bold" style={{ color: t.accent }}>
                        {t.id === 'my-additions' ? '+' : i + 1}
                      </span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15.5px] font-semibold leading-snug">{t.title}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-muted">
                        {articles.length ? `${p.done}/${p.total} read · ${mins} min` : 'Coming soon'}
                      </p>
                    </div>
                    {articles.length > 0 && (
                      <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && articles.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        {t.subtitle && <p className="px-5 pb-1 text-[13.5px] leading-snug text-muted">{t.subtitle}</p>}
                        <ol className="divide-y divide-line px-5">
                          {articles.map((a, j) => (
                            <li key={a.id}>
                              <ArticleRow article={a} index={j + 1} accent={t.accent} />
                            </li>
                          ))}
                        </ol>
                        <Link
                          to={`/track/${t.id}`}
                          className="press flex h-11 items-center gap-1 px-5 text-[13.5px] font-semibold text-brand-ink"
                        >
                          About this part <ArrowRight size={15} />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Page>
  );
}
