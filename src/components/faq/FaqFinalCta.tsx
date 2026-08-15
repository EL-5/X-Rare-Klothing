import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Reveal } from '@/components/about/Reveal';

/** 10 — closes the page the same way About/Contact do: a black statement into a single CTA. */
export function FaqFinalCta() {
  return (
    <section className="bg-ink py-24 text-center lg:py-32">
      <Reveal>
        <h2 className="text-4xl font-semibold uppercase tracking-tight text-surface sm:text-6xl">Rare by design.</h2>
      </Reveal>
      <Reveal delay={0.12}>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-accent">Explore X-Rare</p>
      </Reveal>
      <Reveal delay={0.24}>
        <Link
          to={ROUTES.shop}
          className="mt-9 inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-surface px-8 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-ink transition-colors duration-[var(--duration-base)] hover:bg-surface/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Shop Now
        </Link>
      </Reveal>
    </section>
  );
}
