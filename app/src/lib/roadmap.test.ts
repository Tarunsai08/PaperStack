import { describe, expect, it } from 'vitest';
import { extras, planRoadmap, type RoadmapEntry } from './roadmap';

const e = (id: string, subject: RoadmapEntry['subject'], seq: number, priority: RoadmapEntry['priority'], prerequisites: string[] = []): RoadmapEntry => ({
  id,
  title: id,
  subject,
  track: 't',
  seq,
  priority,
  prerequisites,
  status: 'planned',
});

const entries = [
  e('dsa-b', 'dsa', 2, 'P0', ['dsa-a']),
  e('dsa-a', 'dsa', 1, 'P0'),
  e('dsa-c', 'dsa', 3, 'P1'),
  e('sd-a', 'system-design', 1, 'P0'),
  e('sd-b', 'system-design', 2, 'P0', ['dsa-b']),
  e('ml-x', 'ml', 1, 'P2'),
];

describe('planRoadmap', () => {
  it('6 months only schedules P0, prerequisites first', () => {
    const order = planRoadmap(entries, 6).flatMap((m) => m.entries.map((x) => x.id));
    expect(order.sort()).toEqual(['dsa-a', 'dsa-b', 'sd-a', 'sd-b']);
    const flat = planRoadmap(entries, 6).flatMap((m) => m.entries.map((x) => x.id));
    expect(flat.indexOf('dsa-a')).toBeLessThan(flat.indexOf('dsa-b'));
    expect(flat.indexOf('dsa-b')).toBeLessThan(flat.indexOf('sd-b'));
  });

  it('12 months adds P1 and leaves P2 as extras', () => {
    const ids = planRoadmap(entries, 12).flatMap((m) => m.entries.map((x) => x.id));
    expect(ids).toContain('dsa-c');
    expect(ids).not.toContain('ml-x');
    expect(extras(entries, 12).map((x) => x.id)).toEqual(['ml-x']);
    expect(extras(entries, 6).map((x) => x.id).sort()).toEqual(['dsa-c', 'ml-x']);
  });

  it('interleaves subjects instead of finishing one first', () => {
    const many = [...Array.from({ length: 10 }, (_, i) => e(`dsa-${i}`, 'dsa', i, 'P0')), ...Array.from({ length: 10 }, (_, i) => e(`sd-${i}`, 'system-design', i, 'P0'))];
    const first = planRoadmap(many, 6)[0].entries.map((x) => x.subject);
    expect(new Set(first).size).toBe(2);
  });
});
