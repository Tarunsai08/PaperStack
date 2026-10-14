import { AlertTriangle, Landmark, Lightbulb, PenLine, Sparkles, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type CalloutType = 'insight' | 'analogy' | 'history' | 'warning' | 'try-this';

const STYLES: Record<CalloutType, { label: string; icon: LucideIcon; color: string }> = {
  insight: { label: 'Key insight', icon: Lightbulb, color: '255 159 10' },
  analogy: { label: 'Analogy', icon: Sparkles, color: '124 92 231' },
  history: { label: 'History', icon: Landmark, color: '46 134 222' },
  warning: { label: 'Common misconception', icon: AlertTriangle, color: '229 72 77' },
  'try-this': { label: 'Try this', icon: PenLine, color: '16 172 132' },
};

export function Callout({ type, children }: { type: string; children?: ReactNode }) {
  const s = STYLES[type as CalloutType] ?? STYLES.insight;
  const Icon = s.icon;
  return (
    <aside
      className="callout rounded-r-xl border-l-[3px] px-4 py-3.5 text-[0.93em] leading-[1.62]"
      style={{
        borderColor: `rgb(${s.color})`,
        background: `rgb(${s.color} / 0.09)`,
      }}
    >
      <div
        className="chrome mb-1.5 flex items-center gap-1.5 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/75"
      >
        <Icon size={15} strokeWidth={2.4} aria-hidden style={{ color: `rgb(${s.color})` }} />
        <span>{s.label}</span>
      </div>
      <div className="callout-body space-y-3 [&>*:first-child]:mt-0">{children}</div>
    </aside>
  );
}
