import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { categoryService } from '@/services/categoryService';
import { collectionService } from '@/services/collectionService';
import type { useProductListing } from '@/hooks/useProductListing';
import type { Category } from '@/repositories/categoryRepository';
import type { Collection } from '@/types/domain';

export interface FilterPanelProps {
  listing: ReturnType<typeof useProductListing>;
}

/**
 * Rendered twice — desktop sidebar and mobile drawer — same component in
 * both places (see docs/interaction-map.md: "FILTER AND SORT... rendered
 * twice in the DOM"), unlike the reference's forked markup.
 */
export function FilterPanel({ listing }: FilterPanelProps) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [minInput, setMinInput] = useState(listing.priceMin ? (Number(listing.priceMin)).toString() : '');
  const [maxInput, setMaxInput] = useState(listing.priceMax ? (Number(listing.priceMax)).toString() : '');

  useEffect(() => {
    if (listing.isRouteScoped) return;
    categoryService.list().then(setCategories);
    collectionService.list().then(setCollections);
  }, [listing.isRouteScoped]);

  const handlePriceSubmit = (event: FormEvent) => {
    event.preventDefault();
    listing.setPriceRange(minInput || null, maxInput || null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Filter</h2>
        {listing.activeFilterCount > 0 ? (
          <button type="button" onClick={listing.clearFilters} className="text-xs text-ink/60 underline-offset-2 hover:underline">
            Clear all ({listing.activeFilterCount})
          </button>
        ) : null}
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">Availability</p>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" checked={listing.availabilityOnly} onChange={listing.toggleAvailability} className="h-4 w-4 accent-ink" />
          In stock only
        </label>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">Price</p>
        <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder="Min"
            aria-label="Minimum price"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            className="h-9 w-full rounded-[var(--radius-input)] border border-border bg-surface px-2 text-sm text-ink focus:border-ink focus:outline-none"
          />
          <span className="text-ink/60">–</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder="Max"
            aria-label="Maximum price"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            className="h-9 w-full rounded-[var(--radius-input)] border border-border bg-surface px-2 text-sm text-ink focus:border-ink focus:outline-none"
          />
          <button type="submit" className="h-9 shrink-0 border border-ink px-3 text-xs uppercase tracking-wide text-ink hover:bg-ink hover:text-surface">
            Go
          </button>
        </form>
      </div>

      {!listing.isRouteScoped ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">Category</p>
          <select
            value={listing.selectedCategory ?? ''}
            onChange={(e) => listing.setCategory(e.target.value || null)}
            className="h-9 w-full rounded-[var(--radius-input)] border border-border bg-surface px-2 text-sm text-ink focus:border-ink focus:outline-none"
          >
            <option value="">All Categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!listing.isRouteScoped ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">Collection</p>
          <select
            value={listing.selectedCollection ?? ''}
            onChange={(e) => listing.setCollection(e.target.value || null)}
            className="h-9 w-full rounded-[var(--radius-input)] border border-border bg-surface px-2 text-sm text-ink focus:border-ink focus:outline-none"
          >
            <option value="">All Collections</option>
            {(collections ?? []).map((c) => (
              <option key={c.id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {listing.facets && listing.facets.sizes.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">Size</p>
          <div className="flex flex-wrap gap-2">
            {listing.facets.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => listing.toggleSize(size)}
                aria-pressed={listing.selectedSizes.includes(size)}
                className={`h-9 min-w-9 rounded-[var(--radius-input)] border px-3 text-xs uppercase tracking-wide transition-colors ${
                  listing.selectedSizes.includes(size) ? 'border-ink bg-ink text-surface' : 'border-border text-ink hover:border-ink'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {listing.facets && listing.facets.colors.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">Color</p>
          <div className="flex flex-wrap gap-2">
            {listing.facets.colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => listing.toggleColor(color)}
                aria-pressed={listing.selectedColors.includes(color)}
                className={`h-9 rounded-[var(--radius-input)] border px-3 text-xs uppercase tracking-wide transition-colors ${
                  listing.selectedColors.includes(color) ? 'border-ink bg-ink text-surface' : 'border-border text-ink hover:border-ink'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
