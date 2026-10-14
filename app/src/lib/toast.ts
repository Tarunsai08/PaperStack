import { useSyncExternalStore } from 'react';

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, action?: Toast['action'], ms = 3200): void {
  const t = { id: nextId++, message, action };
  toasts = [...toasts.slice(-2), t];
  emit();
  setTimeout(() => dismissToast(t.id), ms);
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts,
  );
}
