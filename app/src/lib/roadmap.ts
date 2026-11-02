/**
 * Placement Roadmap: turns the curriculum (content/roadmap.json, built by
 * pipeline/build_index.py from content/curriculum/*.json) into a month-by-month
 * reading plan across subjects. Pure, so it is easy to test.
 */
import type { Priority, SubjectId } from './types';

export interface RoadmapEntry {
  id: string;
  title: string;
  subject: SubjectId;
  track: string;
  /** Global position inside the subject: track order, then order in track. */
  seq: number;
  priority: Priority;
  prerequisites: string[];
  status: 'planned' | 'written' | 'needs_review';
}

export interface RoadmapFile {
  generated_from: string;
  entries: RoadmapEntry[];
}

export interface RoadmapMonth {
  month: number;
  entries: RoadmapEntry[];
}

/** Relative urgency: higher weights are scheduled a little earlier in the plan. */
export const SUBJECT_WEIGHTS: Record<SubjectId, number> = {
  dsa: 4,
  'system-design': 2,
  'cs-core': 2,
  cp: 1.5,
  'famous-algos': 1,
  ml: 1,
};

/** Fraction of a subject already scheduled, scaled so heavier subjects (DSA) run a little ahead. */
const share = (s: SubjectId, taken: number, total: number) => taken / total / (1 + ((SUBJECT_WEIGHTS[s] ?? 1) - 1) * 0.15);

/**
 * 6 months: every P0 entry. 12 months: P0 and P1. P2 entries are extras.
 * Order respects prerequisites and interleaves subjects by weight, so each
 * month mixes DSA practice with design and theory.
 */
export function planRoadmap(entries: RoadmapEntry[], months: 6 | 12): RoadmapMonth[] {
  const allowed = new Set<Priority>(months === 6 ? ['P0'] : ['P0', 'P1']);
  const picked = entries.filter((e) => allowed.has(e.priority));
  const inPlan = new Set(picked.map((e) => e.id));
  const queues = new Map<SubjectId, RoadmapEntry[]>();
  for (const e of [...picked].sort((a, b) => a.seq - b.seq)) {
    const q = queues.get(e.subject) ?? [];
    q.push(e);
    queues.set(e.subject, q);
  }
  const totals = new Map([...queues].map(([s, q]) => [s, q.length]));
  const taken = new Map<SubjectId, number>();
  const done = new Set<string>();
  const order: RoadmapEntry[] = [];
  const ready = (e: RoadmapEntry) => e.prerequisites.every((p) => !inPlan.has(p) || done.has(p));

  while (order.length < picked.length) {
    // The subject that is furthest behind its fair share goes next.
    const subjects = [...queues.keys()]
      .filter((s) => queues.get(s)!.length)
      .sort((a, b) => {
        const fa = share(a, taken.get(a) ?? 0, totals.get(a)!);
        const fb = share(b, taken.get(b) ?? 0, totals.get(b)!);
        return fa - fb || a.localeCompare(b);
      });
    let next: RoadmapEntry | undefined;
    for (const s of subjects) {
      const q = queues.get(s)!;
      const i = q.findIndex(ready);
      if (i >= 0) {
        next = q.splice(i, 1)[0];
        break;
      }
    }
    // A prerequisite cycle or a cross-subject wait: take the head of the first queue.
    next ??= queues.get(subjects[0])!.shift()!;
    order.push(next);
    done.add(next.id);
    taken.set(next.subject, (taken.get(next.subject) ?? 0) + 1);
  }

  const per = Math.max(1, Math.ceil(order.length / months));
  return Array.from({ length: months }, (_, i) => ({ month: i + 1, entries: order.slice(i * per, (i + 1) * per) })).filter(
    (m) => m.entries.length,
  );
}

export function extras(entries: RoadmapEntry[], months: 6 | 12): RoadmapEntry[] {
  return entries.filter((e) => (months === 6 ? e.priority !== 'P0' : e.priority === 'P2'));
}
