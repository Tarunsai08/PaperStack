import { Link } from 'react-router-dom';
import { trackProgress } from '../lib/progress';
import { useStore } from '../lib/storage';
import type { Article, Track } from '../lib/types';
import { CoverArt } from './CoverArt';
import { ProgressRing } from './ProgressRing';

export function TrackCard({ track, articles }: { track: Track; articles: Article[] }) {
  const progress = useStore('progress');
  const p = trackProgress(articles, progress);
  return (
    <Link
      to={`/track/${track.id}`}
      className="press block w-[232px] shrink-0 snap-start overflow-hidden rounded-card border border-line bg-surface shadow-card"
    >
      <div className="relative">
        <CoverArt seed={`track-${track.id}`} accent={track.accent} className="aspect-[16/8] w-full" />
        <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          {track.order < 90 ? `Part ${track.order + 1}` : 'Yours'}
        </span>
      </div>
      <div className="flex items-start gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{track.title}</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">
            {p.done}/{p.total} read
          </p>
        </div>
        <ProgressRing pct={p.pct} size={34} stroke={3.5} color={track.accent} label={`${track.title} progress`} />
      </div>
    </Link>
  );
}
