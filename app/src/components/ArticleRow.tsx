import { Link } from 'react-router-dom';
import { statusOf } from '../lib/progress';
import { useStore } from '../lib/storage';
import { kindLabel } from '../lib/subjects';
import type { Article } from '../lib/types';
import { StatusDot } from './StatusDot';

/** Compact list row: status icon, title, kind · read time, priority badge. Used on Home and Learn. */
export function ArticleRow({ article, index, accent, showTrack, small, isNext }: { article: Article; index: number; accent: string; showTrack?: string; small?: boolean; isNext?: boolean }) {
  const progress = useStore('progress')[article.id];
  const st = statusOf(progress);
  return (
    <Link to={`/article/${article.id}`} className={`press flex items-center ${small ? 'gap-2.5 py-2.5' : 'gap-3 py-3'}`}>
      <StatusDot status={st} accent={accent} index={index} pct={progress?.scrollPct ?? 0} small={small} />
      <div className="min-w-0 flex-1">
        <p className={`line-clamp-2 ${small ? 'text-[14.5px]' : 'text-[15px]'} font-medium leading-snug ${st === 'completed' ? 'text-muted' : ''}`}>{article.title}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {isNext && <span className="font-semibold" style={{ color: accent }}>Up next · </span>}
          {showTrack ? `${showTrack} · ` : ''}
          {article.paper_title ? article.year : kindLabel(article.kind)} · {article.read_minutes} min
        </p>
      </div>
      {article.priority && <PriorityBadge priority={article.priority} />}
    </Link>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const strong = priority === 'P0';
  return (
    <span
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${
        strong ? 'bg-brand/12 text-brand-ink' : 'bg-surface-2 text-muted'
      }`}
      title={priority === 'P0' ? 'Must know' : priority === 'P1' ? 'Strongly useful' : 'Extra'}
    >
      {priority}
    </span>
  );
}

/** Thin progress bar (4px), the one progress style used on Home and Learn. */
export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-line" aria-hidden>
      <div className="h-full rounded-full" style={{ width: `${Math.round(pct * 100)}%`, background: color ?? 'rgb(var(--brand))' }} />
    </div>
  );
}
