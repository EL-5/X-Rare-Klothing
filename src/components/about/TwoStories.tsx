import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Reveal } from './Reveal';

/** Explains the two things X-Rare is at once: its own label, and the destination that curates other brands alongside it — added as this codebase became a real multi-brand retailer, not just a single-label store. */
export function TwoStories() {
  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 py-20 lg:px-8 lg:py-32">
      <Reveal>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-accent">Two Stories</p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="mx-auto mt-4 max-w-xl text-center text-3xl font-semibold uppercase leading-tight text-ink sm:text-5xl">
          Rooted in Liberia. Curated for the world.
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="border-t border-border pt-8">
          <p className="text-xs font-semibold text-accent">01</p>
          <h3 className="mt-3 text-xl font-semibold uppercase tracking-wide text-ink">X-Rare, the label.</h3>
          <p className="mt-4 text-sm leading-relaxed text-ink/70">
            X-Rare is our own line — designed and produced by us, not resold from anywhere else. Rare by design,
            different by nature, built for people who don't want to look, think, or move like everybody else.
          </p>
          <Link
            to={ROUTES.brand('x-rare')}
            className="mt-5 inline-block text-sm font-semibold uppercase tracking-wide text-ink underline-offset-4 hover:underline"
          >
            Shop X-Rare
          </Link>
        </Reveal>

        <Reveal delay={0.1} className="border-t border-border pt-8">
          <p className="text-xs font-semibold text-accent">02</p>
          <h3 className="mt-3 text-xl font-semibold uppercase tracking-wide text-ink">X-Rare, the destination.</h3>
          <p className="mt-4 text-sm leading-relaxed text-ink/70">
            X-Rare is also a fashion destination — a curated retail platform that brings X-Rare together with
            carefully selected brands, so customers can discover more than one label in one place. We choose what
            belongs here.
          </p>
          <Link
            to={ROUTES.brands}
            className="mt-5 inline-block text-sm font-semibold uppercase tracking-wide text-ink underline-offset-4 hover:underline"
          >
            Explore Brands
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
