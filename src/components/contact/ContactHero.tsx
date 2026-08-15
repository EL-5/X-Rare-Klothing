import { motion, useReducedMotion } from 'framer-motion';
import { contactImages, unsplashUrl } from '@/data/images';

/** 01 — editorial hero. Landscape crop on desktop, portrait crop on mobile, same source image. */
export function ContactHero() {
  const prefersReducedMotion = useReducedMotion();

  const scrollToNext = () => {
    document.getElementById('lets-talk')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <section className="relative h-[62vh] w-full overflow-hidden bg-ink lg:h-[72vh]">
      <picture>
        <source media="(min-width: 768px)" srcSet={unsplashUrl(contactImages.hero.id, { w: 2400, h: 1400 })} />
        <img
          src={unsplashUrl(contactImages.hero.id, { w: 1000, h: 1400 })}
          alt={contactImages.hero.alt}
          width={1000}
          height={1400}
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-ink/35" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-3xl font-semibold uppercase tracking-tight text-surface sm:text-5xl lg:text-6xl"
        >
          Contact X-Rare
        </motion.h1>
        <motion.p
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-accent"
        >
          We'd love to hear from you.
        </motion.p>
        <motion.p
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-4 max-w-md text-sm leading-relaxed text-surface/85"
        >
          Whether you're asking about an order, a product, a collaboration, or simply want to connect — we're here.
        </motion.p>
      </div>

      <button
        type="button"
        onClick={scrollToNext}
        aria-label="Scroll to contact information"
        className="absolute inset-x-0 bottom-6 flex justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <div className="h-10 w-px overflow-hidden bg-surface/30" aria-hidden="true">
          <motion.div
            className="h-full w-full bg-surface"
            animate={prefersReducedMotion ? undefined : { y: ['-100%', '100%'] }}
            transition={prefersReducedMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </button>
    </section>
  );
}
