import { Link } from 'react-router-dom';
import { trackProgress } from '../lib/progress';
import { useStore } from '../lib/storage';
import type { Article, Subject } from '../lib/types';
import { CoverArt, subjectMotif } from './CoverArt';
import { ProgressRing } from './ProgressRing';

export function SubjectCard({ subject, articles }: { subject: Subject; articles: Article[] }) {
  const progress = useStore('progress');
  const p = trackProgress(articles, progress);
  const soon = subject.status === 'coming-soon';
  return (
    <Link
      to={`/learn?subject=${subject.id}`}
      className="press block w-[232px] shrink-0 snap-start overflow-hidden rounded-card border border-line bg-surface shadow-card"
    >
      <div className="relative">
        <CoverArt
          seed={`subject-${subject.id}`}
          accent={subject.accent}
          motif={subjectMotif(subject)}
          className={`aspect-[16/8] w-full ${soon ? 'opacity-60 grayscale-[35%]' : ''}`}
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          {soon ? 'Coming soon' : subject.short}
        </span>
      </div>
      <div className="flex items-start gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{subject.title}</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">{soon ? 'Curriculum planned' : `${p.done}/${p.total} read`}</p>
        </div>
        {!soon && <ProgressRing pct={p.pct} size={34} stroke={3.5} color={subject.accent} label={`${subject.title} progress`} />}
      </div>
    </Link>
  );
}
