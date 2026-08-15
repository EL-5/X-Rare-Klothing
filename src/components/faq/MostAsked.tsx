import { Reveal } from '@/components/about/Reveal';
import type { Faq } from '@/types/domain';

export interface MostAskedProps {
  faqs: Faq[];
  onSelect: (slug: string) => void;
}

/** 07 — a curated shortlist of real, already-published FAQs (not fabricated "popular" content) that jump straight to the full entry. */
export function MostAsked({ faqs, onSelect }: MostAskedProps) {
  if (faqs.length === 0) return null;

  return (
    <section className="border-t border-border bg-surface-muted py-16 lg:py-24">
      <div className="mx-auto max-w-[var(--container-max)] px-6 lg:px-8">
        <Reveal>
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Most Asked</h2>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {faqs.map((faq, index) => (
            <Reveal key={faq.id} delay={index * 0.05}>
              <button
                type="button"
                onClick={() => onSelect(faq.slug)}
                className="w-full rounded-[var(--radius-card)] border border-border bg-surface p-5 text-left text-sm font-medium uppercase tracking-wide text-ink transition-colors duration-[var(--duration-base)] hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {faq.question}
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
