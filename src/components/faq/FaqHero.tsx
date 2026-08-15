import { motion, useReducedMotion } from 'framer-motion';

/** 01 — elegant typographic hero (no photo — this is a support/utility page, not a campaign moment; kept short per spec's 45–60vh guidance). */
export function FaqHero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="flex h-[38vh] min-h-[280px] w-full flex-col items-center justify-center bg-surface-muted px-6 text-center sm:h-[50vh] lg:h-[58vh]">
      <motion.p
        initial={prefersReducedMotion ? undefined : { opacity: 0, letterSpacing: '0.1em' }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, letterSpacing: '0.25em' }}
        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        className="text-xs font-semibold uppercase tracking-[0.25em] text-accent"
      >
        Support
      </motion.p>
      <motion.h1
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="mt-4 text-4xl font-semibold uppercase tracking-tight text-ink sm:text-6xl lg:text-7xl"
      >
        Frequently Asked.
      </motion.h1>
      <motion.p
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-5 max-w-md text-sm leading-relaxed text-ink/60"
      >
        Everything you need to know before, during, and after your X-Rare experience.
      </motion.p>
    </section>
  );
}
