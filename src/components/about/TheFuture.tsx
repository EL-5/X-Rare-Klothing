import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

const FUTURE = ['Clothing', 'Footwear', 'Accessories', 'Collaborations', 'Limited Drops', 'Flagship Stores', 'Pop-Ups', 'Global Online'];

/** 08 — forward-looking roadmap as a horizontally scrollable strip of large numbered labels, not a bullet list. */
export function TheFuture() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-ink py-20 lg:py-32">
      <div className="mx-auto max-w-[var(--container-max)] px-6 lg:px-8">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold uppercase leading-tight text-surface lg:text-6xl">
            This is only the beginning.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-surface/70">
            The dream is to build X-Rare beyond clothing into a complete fashion and lifestyle house.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className={cn('mt-14 flex gap-px bg-surface/10 px-6 lg:px-8', prefersReducedMotion ? 'flex-wrap' : 'overflow-x-auto pb-4')}>
          {FUTURE.map((item, index) => (
            <div key={item} className="flex min-w-[220px] flex-1 flex-col gap-3 bg-ink py-6 pr-6">
              <span className="text-xs font-semibold text-accent">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-lg font-semibold uppercase tracking-wide text-surface">{item}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
