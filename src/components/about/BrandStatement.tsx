import { Reveal } from './Reveal';

/** 02 — maximal whitespace, one oversized statement. Typography carries the section, not paragraphs. */
export function BrandStatement() {
  return (
    <section id="brand-statement" className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center lg:py-40">
      <Reveal>
        <h2 className="text-4xl font-semibold uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-7xl">
          Being different
          <br />
          is the point.
        </h2>
      </Reveal>
      <Reveal delay={0.15}>
        <p className="mt-8 max-w-sm text-sm text-ink/60">
          X-Rare was created from the belief that being different should be celebrated rather than hidden.
        </p>
      </Reveal>
    </section>
  );
}
