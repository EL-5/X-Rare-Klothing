import { Search, X } from 'lucide-react';
import { Reveal } from '@/components/about/Reveal';

export interface FaqSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/** 02 — instant client-side search (filtering happens in the parent as `value` changes, no debounce needed against an already-fetched small dataset). */
export function FaqSearch({ value, onChange }: FaqSearchProps) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-14 text-center lg:py-20">
      <Reveal>
        <h2 className="text-2xl font-semibold uppercase tracking-tight text-ink sm:text-3xl">How can we help?</h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" aria-hidden="true" />
          <input
            type="search"
            role="searchbox"
            aria-label="Search questions"
            placeholder="Search questions…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-14 w-full rounded-[var(--radius-input)] border border-border bg-surface pl-12 pr-12 text-base text-ink placeholder:text-ink/50 transition-colors duration-[var(--duration-base)] focus:border-ink focus:outline-none"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-ink/50 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
