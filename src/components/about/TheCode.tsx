import { Reveal } from './Reveal';

const CODE = ['Identity', 'Confidence', 'Individuality', 'Movement', 'Exclusivity'];

/** 05 — brand manifesto as a numbered list, one word per line, restrained hover (underline + red accent). */
export function TheCode() {
  return (
    <section className="bg-ink py-24 lg:py-32">
      <div className="mx-auto max-w-[var(--container-max)] px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-accent">The X-Rare Code</p>
        </Reveal>

        <ul className="mt-12 flex flex-col divide-y divide-surface/10 border-t border-surface/10">
          {CODE.map((word, index) => (
            <Reveal key={word} delay={index * 0.06}>
              <li className="group flex items-baseline gap-4 py-5 lg:gap-8 lg:py-7">
                <span className="text-xs font-semibold text-surface/40 lg:text-sm">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-3xl font-semibold uppercase tracking-tight text-surface underline decoration-transparent decoration-2 underline-offset-8 transition-colors duration-[var(--duration-base)] group-hover:text-accent group-hover:decoration-accent sm:text-4xl lg:text-6xl">
                  {word}.
                </span>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
