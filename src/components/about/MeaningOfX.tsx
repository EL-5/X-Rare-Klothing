import { Reveal } from './Reveal';

const WORDS = ['Cross', 'Break', 'Define', 'Move'];

/** 03 — dramatic split section: oversized X graphic against short explanatory copy, on black. */
export function MeaningOfX() {
  return (
    <section className="bg-ink py-24 lg:py-32">
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal direction="none">
          <p
            aria-hidden="true"
            className="select-none text-center font-semibold leading-none text-surface [font-size:38vw] lg:text-left lg:[font-size:22vw]"
          >
            X
          </p>
        </Reveal>

        <div className="flex flex-col gap-8">
          <Reveal>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {WORDS.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl font-semibold uppercase leading-tight text-surface lg:text-5xl">The meaning of X</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="max-w-md text-sm leading-relaxed text-surface/70">
              The X represents crossing boundaries, breaking limits, and creating your own identity.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
