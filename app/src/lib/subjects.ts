import type { Article, Kind } from './types';

const KIND_LABEL: Record<Kind, string> = {
  paper: 'Paper',
  primer: 'Primer',
  pattern: 'Pattern',
  'problem-walkthrough': 'Walkthrough',
  concept: 'Algorithm',
  'deep-dive': 'Deep dive',
  'case-study': 'Case study',
};

export const kindLabel = (k: Kind): string => KIND_LABEL[k] ?? k;

/** Short meta line for list rows, e.g. "Attention Is All You Need · 2017" or "Pattern · P0". */
export function articleMeta(a: Article): string {
  if (a.paper_title) return `${a.paper_title} · ${a.year}`;
  return a.priority ? `${kindLabel(a.kind)} · ${a.priority}` : kindLabel(a.kind);
}

export const PRIORITY_LABEL = { P0: 'Must know', P1: 'Strongly useful', P2: 'Extra' } as const;
