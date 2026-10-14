import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/** Large title used on the four tab screens. */
export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <header className="chrome pt-safe">
      <div className="flex items-end justify-between gap-3 px-5 pb-2 pt-6">
        <div className="min-w-0">
          {subtitle && <p className="text-[13px] font-medium text-muted">{subtitle}</p>}
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.02em]">{title}</h1>
        </div>
        {right}
      </div>
    </header>
  );
}

/** Sticky header with a back button for pushed screens. */
export function BackHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="chrome sticky top-0 z-30 border-b border-line bg-bg pt-safe">
      <div className="mx-auto flex h-14 max-w-[760px] items-center gap-1 px-2">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="press flex h-11 w-11 items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="chrome mb-3 flex items-center justify-between px-5">
      <h2 className="text-[19px] font-bold tracking-[-0.01em]">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="chrome flex flex-col items-center px-8 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-muted">{icon}</div>
      <p className="mt-5 text-[18px] font-semibold">{title}</p>
      <p className="mt-1.5 max-w-[300px] text-[15px] leading-snug text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
