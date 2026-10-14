import { motion } from 'framer-motion';
import { useLayoutEffect, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { usePrefersReducedMotion } from '../lib/theme';

const scrollMemory = new Map<string, number>();

/** Page wrapper: transition + scroll memory (restores position on back). */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  const location = useLocation();
  const navType = useNavigationType();
  const reduced = usePrefersReducedMotion();
  const key = location.key;

  useLayoutEffect(() => {
    const saved = scrollMemory.get(key);
    if (navType === 'POP' && saved !== undefined) {
      requestAnimationFrame(() => window.scrollTo(0, saved));
    } else if (!location.pathname.startsWith('/article/')) {
      window.scrollTo(0, 0);
    }
    return () => {
      scrollMemory.set(key, window.scrollY);
    };
  }, [key, navType, location.pathname]);

  const isPush = navType === 'PUSH';
  return (
    <motion.main
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: isPush ? 28 : 0, y: isPush ? 0 : 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}
