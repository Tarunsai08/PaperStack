import { Check, ExternalLink } from 'lucide-react';
import { haptic, openExternal } from '../lib/native';
import { toggleProblem, useStore } from '../lib/storage';
import type { PracticeProblem } from '../lib/types';

/** Tick-off checklist of practice problems, saved locally per article. */
export function PracticeProblems({ articleId, problems, accent }: { articleId: string; problems: PracticeProblem[]; accent: string }) {
  const solved = useStore('problems')[articleId] ?? [];
  const done = problems.filter((p) => solved.includes(p.url)).length;
  return (
    <section aria-label="Practice problems" className="chrome rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Practice checklist</p>
        <p className="text-[13px] font-semibold" style={{ color: accent }}>
          {done}/{problems.length} solved
        </p>
      </div>
      <ul className="mt-2 divide-y divide-line">
        {problems.map((p) => {
          const isDone = solved.includes(p.url);
          return (
            <li key={p.url} className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                aria-label={`Mark ${p.name} as ${isDone ? 'unsolved' : 'solved'}`}
                onClick={() => {
                  haptic(toggleProblem(articleId, p.url) ? 'success' : 'light');
                }}
                className="press flex h-11 w-11 shrink-0 items-center justify-center"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${isDone ? 'text-white' : 'border-line'}`}
                  style={isDone ? { background: accent, borderColor: accent } : undefined}
                >
                  {isDone && <Check size={15} strokeWidth={3} />}
                </span>
              </button>
              <button
                type="button"
                onClick={() => openExternal(p.url)}
                className="press flex min-h-[48px] min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] font-medium leading-snug ${isDone ? 'text-muted line-through' : ''}`}>{p.name}</span>
                  <span className="block text-[12.5px] text-muted">
                    {p.platform} · {p.difficulty}
                  </span>
                </span>
                <ExternalLink size={16} className="shrink-0 text-muted" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
