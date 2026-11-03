import { Check } from 'lucide-react';
import type { ArticleStatus } from '../lib/progress';

export function StatusDot({ status, accent, index, pct, small }: { status: ArticleStatus; accent: string; index: number; pct: number; small?: boolean }) {
  const box = small ? 'h-6 w-6 text-[11px]' : 'h-8 w-8 text-[12px]';
  if (status === 'completed') {
    return (
      <span className={`flex ${box} shrink-0 items-center justify-center rounded-full text-white`} style={{ background: accent }} aria-label="Completed">
        <Check size={small ? 13 : 16} strokeWidth={3} />
      </span>
    );
  }
  if (status === 'in-progress') {
    const d = small ? 24 : 32;
    const r = small ? 10.5 : 14;
    const c = 2 * Math.PI * r;
    return (
      <span className={`relative flex ${box} shrink-0 items-center justify-center`} aria-label="In progress">
        <svg width={d} height={d} className="absolute -rotate-90">
          <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke="rgb(var(--border))" strokeWidth="2.5" />
          <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0.08, pct))} strokeLinecap="round" />
        </svg>
        <span className="font-bold">{index}</span>
      </span>
    );
  }
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-full border-2 border-line font-bold text-muted`} aria-label="Not started">
      {index}
    </span>
  );
}
