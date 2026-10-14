import { AnimatePresence, motion } from 'framer-motion';
import { dismissToast, useToasts } from '../lib/toast';

/** Bottom toasts, sitting above the tab bar when it is visible. */
export function Toaster({ aboveTabs }: { aboveTabs: boolean }) {
  const toasts = useToasts();
  return (
    <div
      className="chrome pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4"
      style={{ paddingBottom: aboveTabs ? 'calc(var(--tabbar-h) + var(--sab) + 12px)' : 'calc(var(--sab) + 24px)' }}
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="pointer-events-auto flex max-w-[480px] items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-bg shadow-float"
            onClick={() => dismissToast(t.id)}
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                className="font-semibold text-brand"
                onClick={(e) => {
                  e.stopPropagation();
                  t.action?.onClick();
                  dismissToast(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
