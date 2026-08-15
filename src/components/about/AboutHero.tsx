import { motion, useReducedMotion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { aboutImages, unsplashUrl } from '@/data/images';

/** 01 — full-screen cinematic hero. Opens the page like a fashion magazine cover, not a document. */
export function AboutHero() {
  const prefersReducedMotion = useReducedMotion();

  const scrollToNext = () => {
    document.getElementById('brand-statement')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <section className="relative h-[78vh] w-full overflow-hidden bg-ink lg:h-[92vh]">
      <OptimizedImage
        src={unsplashUrl(aboutImages.hero.id, { w: 2400, h: 2800 })}
        alt={aboutImages.hero.alt}
        width={2400}
        height={2800}
        containerClassName="h-full w-full"
        className="opacity-90"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-ink/40" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={prefersReducedMotion ? undefined : { opacity: 0, letterSpacing: '0.1em' }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, letterSpacing: '0.35em' }}
          transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
          className="text-4xl font-semibold uppercase tracking-[0.35em] text-surface sm:text-6xl lg:text-8xl"
        >
          X-RARE
        </motion.h1>
        <motion.p
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="mt-6 max-w-md text-sm font-semibold uppercase tracking-[0.25em] text-surface/90 lg:text-base"
        >
          Rare by design.
          <br />
          Different by nature.
        </motion.p>

        <motion.button
          type="button"
          onClick={scrollToNext}
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-accent transition-colors duration-[var(--duration-base)] hover:text-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Discover X-Rare
        </motion.button>
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center" aria-hidden="true">
        <div className="h-10 w-px overflow-hidden bg-surface/30">
          <motion.div
            className="h-full w-full bg-surface"
            animate={prefersReducedMotion ? undefined : { y: ['-100%', '100%'] }}
            transition={prefersReducedMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </section>
  );
}
