import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TabHeader } from '../components/Headers';
import { Page } from '../components/Page';
import { ProgressRing } from '../components/ProgressRing';
import { ListSkeleton } from '../components/Skeleton';
import { StatusDot } from '../components/StatusDot';
import { nextInPath, statusOf, trackProgress } from '../lib/progress';
import { useStore } from '../lib/storage';
import { useContent } from '../lib/useContent';

export default function Learn() {
  const content = useContent();
  const progress = useStore('progress');
  const next = useMemo(() => nextInPath(content.path, progress), [content.path, progress]);
  const [open, setOpen] = useState<string | null>(() => null);
  const openId = open ?? next?.track ?? content.tracks[0]?.id ?? null;
  const overall = trackProgress(content.path, progress);

  return (
    <Page>
      <TabHeader title="Learn" subtitle="Your learning path" />
      {!content.ready ? (
        <div className="px-5 pt-4">
          <ListSkeleton rows={6} />
        </div>
      ) : (
        <>
          <section className="chrome mx-5 mt-3 flex items-center gap-5 rounded-card border border-line bg-surface p-5 shadow-card">
            <ProgressRing pct={overall.pct} size={76} stroke={7} label="Overall progress">
              <span className="text-[18px] font-bold">{Math.round(overall.pct * 100)}%</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold leading-snug">
                {overall.done === 0 ? 'Your journey starts here' : overall.done === overall.total ? 'Path complete!' : 'Making progress'}
              </p>
              <p className="mt-0.5 text-[14px] text-muted">
                {overall.done} of {overall.total} articles · {content.tracks.length} parts
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
            {content.tracks.map((t, i) => {
              const articles = content.articlesInTrack(t.id);
              const p = trackProgress(articles, progress);
              const isOpen = openId === t.id;
              const firstUnread = articles.find((a) => !progress[a.id]?.completedAt);
              return (
                <li key={t.id} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
                  <button
                    onClick={() => setOpen(isOpen ? '' : t.id)}
                    className="chrome flex w-full items-center gap-4 p-4 text-left"
                    aria-expanded={isOpen}
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
                        {p.done}/{p.total} read
                      </p>
                    </div>
                    <ChevronDown size={20} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
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
                                      {a.paper_title ? `${a.paper_title} · ${a.year}` : 'Primer'} · {a.read_minutes} min
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
