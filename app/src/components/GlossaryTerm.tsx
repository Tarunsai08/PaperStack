import { createContext, useContext, type ReactNode } from 'react';
import { haptic } from '../lib/native';

export const GlossaryContext = createContext<((term: string) => void) | null>(null);

export function GlossaryTerm({ term, children }: { term?: string; children?: ReactNode }) {
  const open = useContext(GlossaryContext);
  return (
    <span
      role="button"
      tabIndex={0}
      className="gloss"
      onClick={(e) => {
        e.stopPropagation();
        haptic('selection');
        open?.(term ?? '');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open?.(term ?? '');
        }
      }}
      aria-label={`${typeof children === 'string' ? children : term}: show definition`}
    >
      {children}
    </span>
  );
}
