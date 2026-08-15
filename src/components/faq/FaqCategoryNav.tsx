import { cn } from '@/lib/cn';
import { FAQ_CATEGORY_LABELS } from '@/services/faqService';
import type { FaqCategory } from '@/types/domain';

export interface FaqCategoryNavProps {
  categories: FaqCategory[];
  selected: FaqCategory | null;
  onSelect: (category: FaqCategory | null) => void;
}

/** 03 — horizontal category filter (scrollable on mobile). Categories are derived from the real published FAQ set, never hardcoded, so an empty category never appears. */
export function FaqCategoryNav({ categories, selected, onSelect }: FaqCategoryNavProps) {
  return (
    <nav aria-label="FAQ categories" className="border-y border-border">
      <div className="mx-auto flex max-w-[var(--container-max)] gap-2 overflow-x-auto px-6 py-4 lg:px-8">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-current={selected === null}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-[var(--duration-base)]',
            selected === null ? 'border-accent bg-accent text-surface' : 'border-border text-ink/70 hover:border-ink hover:text-ink',
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            aria-current={selected === category}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-[var(--duration-base)]',
              selected === category ? 'border-accent bg-accent text-surface' : 'border-border text-ink/70 hover:border-ink hover:text-ink',
            )}
          >
            {FAQ_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>
    </nav>
  );
}
