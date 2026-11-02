import { useContent } from '../lib/useContent';
import type { Article, Track } from '../lib/types';
import { CoverArt, subjectMotif } from './CoverArt';

/** Cover for an article: track accent plus its subject's motif. */
export function ArticleCover({ article, className, title }: { article: Article; className?: string; title?: string }) {
  const { trackById, subjectById } = useContent();
  return (
    <CoverArt
      seed={article.cover_seed}
      accent={trackById.get(article.track)?.accent ?? '#FF6719'}
      motif={subjectMotif(subjectById.get(article.subject ?? 'ml'))}
      className={className}
      title={title}
    />
  );
}

/** Cover for a track header or card. */
export function TrackCover({ track, className }: { track: Track; className?: string }) {
  const { subjectById } = useContent();
  return (
    <CoverArt
      seed={`track-${track.id}`}
      accent={track.accent}
      motif={subjectMotif(subjectById.get(track.subject ?? 'ml'))}
      className={className}
    />
  );
}
