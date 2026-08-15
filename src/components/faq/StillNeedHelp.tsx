import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Reveal } from '@/components/about/Reveal';

/** 08 — the escape hatch out of self-serve into real human support. */
export function StillNeedHelp() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center lg:py-24">
      <Reveal>
        <h2 className="text-3xl font-semibold uppercase tracking-tight text-ink sm:text-4xl">Still looking?</h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-4 text-sm text-ink/60">Can't find what you're looking for?</p>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={ROUTES.contact}
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-ink px-8 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-surface transition-colors duration-[var(--duration-base)] hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Contact X-Rare
          </Link>
          <Link
            to={ROUTES.accountOrders}
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] border border-ink px-8 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-ink transition-colors duration-[var(--duration-base)] hover:bg-ink hover:text-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Track My Order
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
