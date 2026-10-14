import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { haptic } from '../lib/native';

const THRESHOLD = 72;

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<unknown>; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef<number | null>(null);
  const armed = useRef(false);
  const pullRef = useRef(0);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || busy) return;
      start.current = e.touches[0].clientY;
      armed.current = false;
    };
    const onMove = (e: TouchEvent) => {
      if (start.current === null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const d = Math.min(120, dy * 0.5);
      if (d >= THRESHOLD && !armed.current) {
        armed.current = true;
        haptic('light');
      }
      pullRef.current = d;
      setPull(d);
    };
    const onEnd = async () => {
      if (start.current === null) return;
      start.current = null;
      if (pullRef.current >= THRESHOLD) {
        setBusy(true);
        setPull(THRESHOLD * 0.75);
        try {
          await onRefresh();
        } finally {
          setBusy(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
      pullRef.current = 0;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [busy, onRefresh]);

  return (
    <div className="relative">
      <div
        className="chrome pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
        style={{ transform: `translateY(${pull - 40}px)`, opacity: Math.min(1, pull / THRESHOLD) }}
        aria-hidden={!busy}
      >
        <div className="mt-[var(--sat)] flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface shadow-card">
          <motion.div
            animate={busy ? { rotate: 360 } : { rotate: pull * 3 }}
            transition={busy ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
          >
            <RefreshCw size={18} className={pull >= THRESHOLD || busy ? 'text-brand' : 'text-muted'} />
          </motion.div>
        </div>
      </div>
      <div style={{ transform: pull ? `translateY(${pull * 0.6}px)` : undefined, transition: start.current === null ? 'transform 200ms ease' : undefined }}>
        {children}
      </div>
    </div>
  );
}
