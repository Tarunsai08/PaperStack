import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/useContent';
import { useStore } from '../lib/storage';
import type { Article } from '../lib/types';
import { CoverArt } from './CoverArt';

type Variant = 'feed' | 'row' | 'featured' | 'compact';

function Meta({ article, showTrack = true }: { article: Article; showTrack?: boolean }) {
  const { trackById } = useContent();
  const track = trackById.get(article.track);
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium text-muted">
      {showTrack && track && (
        <>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: track.accent }} aria-hidden />
          <span className="truncate">{track.title}</span>
          <span aria-hidden>·</span>
        </>
      )}
      <span className="shrink-0">{article.read_minutes} min</span>
      {article.source === 'imported' && (
        <span className="ml-1 shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold">Imported</span>
      )}
    </div>
  );
}

function Status({ id }: { id: string }) {
  const progress = useStore('progress')[id];
  if (progress?.completedAt) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10AC84] text-white" aria-label="Completed">
        <Check size={14} strokeWidth={3} />
      </span>
    );
  }
  if (progress && progress.scrollPct > 0.02) {
    return (
      <span className="text-[12px] font-semibold text-brand-ink" aria-label="In progress">
        {Math.round(progress.scrollPct * 100)}%
      </span>
    );
  }
  return null;
}

export function ArticleCard({ article, variant = 'feed' }: { article: Article; variant?: Variant }) {
  const { trackById } = useContent();
  const accent = trackById.get(article.track)?.accent ?? '#FF6719';
  const to = `/article/${article.id}`;

  if (variant === 'row' || variant === 'compact') {
    return (
      <Link to={to} className="press group flex items-start gap-4 rounded-xl py-1">
        <div className="min-w-0 flex-1">
          <Meta article={article} />
          <h3 className="mt-1 line-clamp-2 font-serif text-[17px] font-semibold leading-snug">{article.title}</h3>
          {variant === 'row' && (
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-muted">{article.subtitle}</p>
          )}
        </div>
        <div className="relative shrink-0">
          <CoverArt seed={article.cover_seed} accent={accent} className="h-[68px] w-[92px] rounded-xl" />
          <div className="absolute -bottom-1.5 -right-1.5">
            <Status id={article.id} />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link to={to} className="press block overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="relative">
          <CoverArt seed={article.cover_seed} accent={accent} className="aspect-[16/10] w-full" title={article.title} />
          <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            Featured
          </span>
        </div>
        <div className="p-4 pb-5">
          <Meta article={article} />
          <h3 className="mt-1.5 font-serif text-[23px] font-semibold leading-tight tracking-[-0.01em]">{article.title}</h3>
          <p className="mt-1.5 text-[15px] leading-snug text-muted">{article.subtitle}</p>
          {article.paper_title && (
            <p className="mt-3 truncate text-[12.5px] text-muted">
              <span className="font-semibold text-ink/80">{article.year}</span> · {article.paper_title}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link to={to} className="press block">
      <div className="relative">
        <CoverArt seed={article.cover_seed} accent={accent} className="aspect-[16/9] w-full rounded-card" />
        <div className="absolute right-2.5 top-2.5">
          <Status id={article.id} />
        </div>
      </div>
      <div className="mt-3">
        <Meta article={article} />
        <h3 className="mt-1 font-serif text-[20px] font-semibold leading-snug">{article.title}</h3>
        <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-muted">{article.subtitle}</p>
      </div>
    </Link>
  );
}
