import { Reveal } from '@/components/about/Reveal';

/** 06 — no physical store is configured in this application, so per spec this stays honest rather than inventing an address. */
export function StoreLocation() {
  return (
    <section className="border-y border-border bg-surface-muted py-20 lg:py-32">
      <div className="mx-auto max-w-[var(--container-max)] px-6 text-center lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Online Store</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-ink lg:text-5xl">Currently available online.</h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-md text-sm text-ink/60">
            X-Rare doesn't have a physical store or studio yet — every collection ships directly from our online shop.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
