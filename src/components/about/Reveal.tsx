import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** 'up' slides in from below (default), 'none' fades only — for large type blocks where a slide reads as noisy. */
  direction?: 'up' | 'none';
}

/** Shared scroll-reveal wrapper for the About page — fade + slight rise, once per element, restrained duration. Renders static when the user prefers reduced motion. */
export function Reveal({ children, className, delay = 0, direction = 'up' }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: direction === 'up' ? 28 : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
