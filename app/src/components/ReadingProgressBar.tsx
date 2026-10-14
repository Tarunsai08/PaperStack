import { motion, useScroll, useSpring } from 'framer-motion';

export function ReadingProgressBar({ color = 'rgb(var(--brand))' }: { color?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 34, restDelta: 0.001 });
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 h-[2.5px] origin-left"
      style={{ scaleX, background: color }}
      aria-hidden
    />
  );
}
