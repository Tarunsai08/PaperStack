import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState, TabHeader } from '../components/Headers';
import { Page } from '../components/Page';
import { ProgressRing } from '../components/ProgressRing';
import { ListSkeleton } from '../components/Skeleton';
import { StatusDot } from '../components/StatusDot';
import { nextInPath, statusOf, trackProgress } from '../lib/progress';
import { haptic } from '../lib/native';
import { setPrefs, useStore } from '../lib/storage';
import { articleMeta } from '../lib/subjects';
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
        <div className="chrome no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1 pt-2" role="tablist" aria-label="Subjects">
          {content.subjects.map((sub) => {
            const active = sub.id === subjectId;
            return (
              <button
                key={sub.id}
                role="tab"
                aria-selected={active}
                onClick={() => pick(sub.id)}
                className={`press flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13.5px] font-semibold transition-colors ${
                  active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: sub.accent }} aria-hidden />
                {sub.short}
              </button>
            );
          })}
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
          <section className="chrome mx-5 mt-3 flex items-center gap-5 rounded-card border border-line bg-surface p-5 shadow-card">
            <ProgressRing pct={overall.pct} size={76} stroke={7} color={subject?.accent} label="Subject progress">
              <span className="text-[18px] font-bold">{Math.round(overall.pct * 100)}%</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold leading-snug">
                {overall.done === 0 ? 'Your journey starts here' : overall.done === overall.total ? 'Path complete!' : 'Making progress'}
              </p>
              <p className="mt-0.5 text-[14px] text-muted">
                {overall.done} of {overall.total} articles · {tracks.length} parts
                {problems.length > 0 && ` · ${problemsSolved}/${problems.length} problems solved`}
              </p>
              {next && (
                <Link
                  to={`/article/${next.id}`}
                  className="press mt-3 inline-flex h-11 items-center rounded-full bg-brand-btn px-5 text-[14px] font-semibold text-white"
                >
                  {progress[next.id] ? 'Continue' : overall.done ? 'Next article' : 'Start the path'}
                </Link>
              )}
            </div>
          </section>

          <ol className="relative mt-8 space-y-3 px-5">
            {tracks.map((t, i) => {
              const articles = content.articlesInTrack(t.id);
              const p = trackProgress(articles, progress);
              const isOpen = openId === t.id;
              const firstUnread = articles.find((a) => !progress[a.id]?.completedAt);
              return (
                <li key={t.id} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
                  <button
                    onClick={() => articles.length && setOpen(isOpen ? '' : t.id)}
                    className={`chrome flex w-full items-center gap-4 p-4 text-left ${articles.length ? '' : 'cursor-default'}`}
                    aria-expanded={articles.length ? isOpen : undefined}
                    aria-disabled={!articles.length}
                  >
                    <ProgressRing pct={p.pct} size={46} stroke={4} color={t.accent} label={`${t.title} progress`}>
                      <span className="text-[13px] font-bold" style={{ color: t.accent }}>
                        {t.id === 'my-additions' ? '+' : i + 1}
                      </span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold leading-snug">{t.title}</p>
                      <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{t.subtitle}</p>
                      <p className="mt-1 text-[12.5px] font-medium text-muted">
                        {articles.length ? `${p.done}/${p.total} read` : 'Coming soon'}
                      </p>
                    </div>
                    {articles.length > 0 && (
                      <ChevronDown size={20} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                        <ol className="border-t border-line px-2 py-2">
                          {articles.map((a, j) => {
                            const st = statusOf(progress[a.id]);
                            return (
                              <li key={a.id}>
                                <Link to={`/article/${a.id}`} className="press flex items-center gap-3 rounded-xl px-2 py-2.5">
                                  <StatusDot status={st} accent={t.accent} index={j + 1} pct={progress[a.id]?.scrollPct ?? 0} />
                                  <div className="min-w-0 flex-1">
                                    <p className={`line-clamp-2 text-[15px] font-medium leading-snug ${st === 'completed' ? 'text-muted' : ''}`}>
                                      {a.title}
                                    </p>
                                    <p className="mt-0.5 truncate text-[12.5px] text-muted">
                                      {articleMeta(a)} · {a.read_minutes} min
                                    </p>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ol>
                        <div className="chrome flex gap-2 border-t border-line p-3">
                          {firstUnread && (
                            <Link
                              to={`/article/${firstUnread.id}`}
                              className="press flex h-11 flex-1 items-center justify-center rounded-full text-[14px] font-semibold text-white"
                              style={{ background: 'rgb(var(--brand-btn))' }}
                            >
                              {p.done || progress[firstUnread.id] ? 'Continue' : 'Start'}
                            </Link>
                          )}
                          <Link
                            to={`/track/${t.id}`}
                            className="press flex h-11 flex-1 items-center justify-center rounded-full border border-line text-[14px] font-semibold"
                          >
                            About this part
                          </Link>
                        </div>
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
