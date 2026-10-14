import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { pushBackHandler } from '../lib/backStack';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Hide the close button (e.g. for short action sheets). */
  bare?: boolean;
}

export function BottomSheet({ open, onClose, title, children, bare }: Props) {
  const drag = useDragControls();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const pop = pushBackHandler(onClose);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      pop();
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 90 || info.velocity.y > 500) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center chrome">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className="relative w-full max-w-[560px] rounded-t-[22px] bg-surface shadow-float"
            style={{ paddingBottom: 'calc(var(--sab) + 12px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div
              className="flex cursor-grab touch-none justify-center pb-1 pt-3"
              onPointerDown={(e) => drag.start(e)}
            >
              <div className="h-1.5 w-10 rounded-full bg-line" />
            </div>
            {(title || !bare) && (
              <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-1" onPointerDown={(e) => drag.start(e)}>
                <div id={titleId} className="min-w-0 flex-1 text-[17px] font-semibold leading-snug">
                  {title}
                </div>
                {!bare && (
                  <button
                    onClick={onClose}
                    className="press -mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="max-h-[72dvh] overflow-y-auto overscroll-contain px-5 pb-2 pt-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
