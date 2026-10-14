import { useSyncExternalStore } from 'react';
import type { Track } from './types';

let current: Track | null = null;
const listeners = new Set<() => void>();

export function celebrateTrack(t: Track): void {
  current = t;
  listeners.forEach((l) => l());
}

export function clearCelebration(): void {
  current = null;
  listeners.forEach((l) => l());
}

export function useCelebration(): Track | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}
