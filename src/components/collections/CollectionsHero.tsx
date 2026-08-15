import { Reveal } from '@/components/about/Reveal';

/** Typographic hero — maximal whitespace, one statement, matching the About page's BrandStatement treatment. */
export function CollectionsHero() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center lg:py-32">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Curation</p>
      </Reveal>
      <Reveal delay={0.08}>
        <h1 className="mt-5 text-4xl font-semibold uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Every collection
          <br />
          earns its place.
        </h1>
      </Reveal>
      <Reveal delay={0.16}>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
          We don't sort by season for the sake of it. Each edit below is a specific answer to a specific mood — here's what's live right now.
        </p>
      </Reveal>
    </section>
  );
}
