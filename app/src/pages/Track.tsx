import { Link, useParams } from 'react-router-dom';
import { CoverArt } from '../components/CoverArt';
import { BackHeader } from '../components/Headers';
import { Page } from '../components/Page';
import { ProgressRing } from '../components/ProgressRing';
import { ListSkeleton } from '../components/Skeleton';
import { StatusDot } from '../components/StatusDot';
import { statusOf, trackProgress } from '../lib/progress';
import { useStore } from '../lib/storage';
import { useContent } from '../lib/useContent';

export default function TrackPage() {
  const { id = '' } = useParams();
  const content = useContent();
  const progress = useStore('progress');
  const track = content.trackById.get(id);
  const articles = content.articlesInTrack(id);
  const p = trackProgress(articles, progress);
  const firstUnread = articles.find((a) => !progress[a.id]?.completedAt);
  const minutes = articles.reduce((s, a) => s + a.read_minutes, 0);

  return (
    <Page>
      <BackHeader title={track?.title ?? ''} />
      {!content.ready ? (
        <div className="px-5 pt-6">
          <ListSkeleton rows={6} />
        </div>
      ) : !track ? (
        <p className="p-8 text-center text-muted">This part of the path doesn't exist.</p>
      ) : (
        <div className="mx-auto max-w-read pb-10">
          <div className="relative mx-5 mt-5 overflow-hidden rounded-card">
            <CoverArt seed={`track-${track.id}`} accent={track.accent} className="aspect-[16/9] w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] opacity-85">
                {track.order < 90 ? `Part ${track.order + 1}` : 'Your additions'}
              </p>
              <h2 className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.015em]">{track.title}</h2>
            </div>
          </div>
          <div className="px-5">
            <p className="mt-5 font-serif text-[17px] leading-relaxed">{track.description ?? track.subtitle}</p>
            <div className="chrome mt-5 flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
              <ProgressRing pct={p.pct} size={52} stroke={5} color={track.accent} label="Track progress">
                <span className="text-[13px] font-bold">{Math.round(p.pct * 100)}%</span>
              </ProgressRing>
              <div className="flex-1 text-[14px] text-muted">
                <p className="font-semibold text-ink">
                  {p.done} of {p.total} read
                </p>
                <p>About {minutes} minutes in total</p>
              </div>
              {firstUnread && (
                <Link
                  to={`/article/${firstUnread.id}`}
                  className="press flex h-11 items-center rounded-full bg-brand-btn px-5 text-[14px] font-semibold text-white"
                >
                  {p.done || progress[firstUnread.id] ? 'Continue' : 'Start'}
                </Link>
              )}
            </div>
          </div>
          <ol className="mt-6 space-y-1 px-3">
            {articles.map((a, i) => {
              const st = statusOf(progress[a.id]);
              return (
                <li key={a.id}>
                  <Link to={`/article/${a.id}`} className="press flex items-start gap-3.5 rounded-2xl px-2 py-3">
                    <div className="pt-0.5">
                      <StatusDot status={st} accent={track.accent} index={i + 1} pct={progress[a.id]?.scrollPct ?? 0} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-[17px] font-semibold leading-snug">{a.title}</p>
                      <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-muted">{a.subtitle}</p>
                      <p className="mt-1.5 text-[12.5px] font-medium text-muted">
                        {a.paper_title ? `${a.year} · ` : 'Primer · '}
                        {a.read_minutes} min
                        {a.source === 'imported' ? ' · Imported' : ''}
                      </p>
                    </div>
                    <CoverArt seed={a.cover_seed} accent={track.accent} className="mt-1 h-14 w-14 shrink-0 rounded-xl" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Page>
  );
}
