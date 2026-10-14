import { Check } from 'lucide-react';
import type { ArticleStatus } from '../lib/progress';

export function StatusDot({ status, accent, index, pct }: { status: ArticleStatus; accent: string; index: number; pct: number }) {
  if (status === 'completed') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ background: accent }} aria-label="Completed">
        <Check size={16} strokeWidth={3} />
      </span>
    );
  }
  if (status === 'in-progress') {
    const r = 14;
    const c = 2 * Math.PI * r;
    return (
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center" aria-label="In progress">
        <svg width="32" height="32" className="absolute -rotate-90">
          <circle cx="16" cy="16" r={r} fill="none" stroke="rgb(var(--border))" strokeWidth="2.5" />
          <circle cx="16" cy="16" r={r} fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0.08, pct))} strokeLinecap="round" />
        </svg>
        <span className="text-[12px] font-bold">{index}</span>
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line text-[12px] font-bold text-muted" aria-label="Not started">
      {index}
    </span>
  );
}
