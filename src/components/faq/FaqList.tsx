import { Link } from 'react-router-dom';
import { FaqAccordionItem } from './FaqAccordionItem';
import { Reveal } from '@/components/about/Reveal';
import { FAQ_CATEGORY_LABELS } from '@/services/faqService';
import { ROUTES } from '@/config/routes';
import type { Faq, FaqCategory } from '@/types/domain';

export interface FaqListProps {
  faqs: Faq[];
  query: string;
  openSlug: string | null;
  onToggle: (slug: string) => void;
}

/** 04 — the FAQ content itself. Flat "N results" list while searching; grouped by category otherwise, so browsing without a search term still feels organized. */
export function FaqList({ faqs, query, openSlug, onToggle }: FaqListProps) {
  const isSearching = query.trim().length > 0;

  if (isSearching) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-10 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
          {faqs.length} result{faqs.length === 1 ? '' : 's'}
        </p>
        {faqs.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <p className="text-xl font-semibold uppercase tracking-wide text-ink">Nothing found.</p>
            <p className="text-sm text-ink/60">Try another search, or contact X-Rare.</p>
            <Link
              to={ROUTES.contact}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-ink px-6 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-surface transition-colors duration-[var(--duration-base)] hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Contact Us
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            {faqs.map((faq) => (
              <FaqAccordionItem key={faq.id} faq={faq} isOpen={openSlug === faq.slug} onToggle={() => onToggle(faq.slug)} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const grouped = new Map<FaqCategory, Faq[]>();
  for (const faq of faqs) {
    grouped.set(faq.category, [...(grouped.get(faq.category) ?? []), faq]);
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-10 lg:px-8">
      {[...grouped.entries()].map(([category, items]) => (
        <Reveal key={category} className="mb-12 last:mb-0">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{FAQ_CATEGORY_LABELS[category]}</h2>
          <div className="mt-2">
            {items.map((faq) => (
              <FaqAccordionItem key={faq.id} faq={faq} isOpen={openSlug === faq.slug} onToggle={() => onToggle(faq.slug)} />
            ))}
          </div>
        </Reveal>
      ))}
    </section>
  );
}
