import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { pushBackHandler } from '../lib/backStack';
import { clearCelebration, useCelebration } from '../lib/celebrate';
import { haptic } from '../lib/native';
import { usePrefersReducedMotion } from '../lib/theme';
import { useContent } from '../lib/useContent';

export function Celebration() {
  const track = useCelebration();
  const reduced = usePrefersReducedMotion();
  const navigate = useNavigate();
  const { tracks } = useContent();
  const next = track ? tracks.find((t) => t.order > track.order && t.id !== 'my-additions') : undefined;

  useEffect(() => {
    if (!track) return;
    haptic('success');
    return pushBackHandler(clearCelebration);
  }, [track]);

  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return { x: Math.cos(a) * (70 + (i % 3) * 18), y: Math.sin(a) * (70 + (i % 3) * 18), d: (i % 4) * 0.04 };
      }),
    [],
  );

  return createPortal(
    <AnimatePresence>
      {track && (
        <motion.div
          className="chrome fixed inset-0 z-[65] flex items-center justify-center bg-black/45 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clearCelebration}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Track complete"
            className="relative w-full max-w-[360px] rounded-[24px] bg-surface p-7 text-center shadow-float"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mx-auto h-24 w-24">
              {!reduced &&
                sparks.map((s, i) => (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                    style={{ background: i % 2 ? track.accent : 'rgb(var(--brand))' }}
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{ x: s.x, y: s.y, opacity: [0, 1, 0] }}
                    transition={{ duration: 1.1, delay: 0.25 + s.d, ease: 'easeOut' }}
                  />
                ))}
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-full text-white"
                style={{ background: track.accent }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 260, delay: 0.1 }}
              >
                <Check size={44} strokeWidth={3} />
              </motion.div>
            </div>
            <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">Track complete</p>
            <h2 className="mt-1 font-serif text-[24px] font-semibold leading-tight">{track.title}</h2>
            <p className="mt-2 text-[15px] leading-snug text-muted">
              You worked through every article in this part of the path. That is real progress.
            </p>
            {next ? (
              <button
                onClick={() => {
                  clearCelebration();
                  navigate(`/track/${next.id}`);
                }}
                className="press mt-6 h-12 w-full rounded-full bg-brand-btn text-[15px] font-semibold text-white"
              >
                Next: {next.title}
              </button>
            ) : null}
            <button onClick={clearCelebration} className="press mt-2 h-11 w-full rounded-full text-[15px] font-semibold text-muted">
              Keep reading
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
