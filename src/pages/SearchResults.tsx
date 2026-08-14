import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { QuickViewDrawer } from '@/components/product/QuickViewDrawer';
import { Button } from '@/components/ui/Button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { searchService } from '@/services/searchService';
import { analyticsService } from '@/services/analyticsService';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import type { Product, SearchResult } from '@/types/domain';

const PAGE_SIZE = 24;

/**
 * Full-navigation results page, numbered pagination (not "Load more") to
 * match the reference's /search template specifically — collection pages
 * use Load more, search uses `?page=N`; see docs/component-inventory.md's
 * explicit note that this inconsistency is intentional to preserve here.
 */
export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  const [inputValue, setInputValue] = useState(query);
  const debouncedInput = useDebouncedValue(inputValue, 400);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { recent, record, clear } = useRecentSearches();

  useDocumentHead({
    title: query.trim() ? `Search results for "${query.trim()}"` : 'Search',
    path: '/search',
    noindex: true,
  });

  useEffect(() => setInputValue(query), [query]);

  useEffect(() => {
    if (debouncedInput === query) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedInput) next.set('q', debouncedInput);
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  useEffect(() => {
    if (!query.trim()) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setResult(null);
    searchService.search(query, page, PAGE_SIZE).then((data) => {
      if (cancelled) return;
      setResult(data);
      record(query);
      void analyticsService.trackSearch(query, data.total);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  const goToPage = (nextPage: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(nextPage));
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-6 py-10 lg:px-8">
      <h1 className="text-xs font-semibold uppercase tracking-wide text-ink/60">Search Results</h1>

      <div className="relative mt-4 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
        <input
          type="search"
          autoFocus
          aria-label="Search for anything"
          placeholder="Search for anything"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-12 w-full rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      {!query.trim() && recent.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-ink/60">Recent Searches</p>
            <button type="button" onClick={clear} className="text-xs text-ink/60 underline-offset-2 hover:underline">
              Clear
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setInputValue(term)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-ink/70 hover:border-ink hover:text-ink"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {query.trim() ? (
        <div className="mt-8">
          {result === null ? (
            <ProductGrid products={null} />
          ) : result.products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-sm text-ink">
                No results found for “{result.query}”.
              </p>
              <p className="text-sm text-ink/60">Check the spelling or use a different word or phrase.</p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-xs uppercase tracking-wide text-ink/60">
                {result.total} result{result.total === 1 ? '' : 's'} found for “{result.query}”
              </p>
              <ProductGrid products={result.products} onQuickView={setQuickViewProduct} />

              {totalPages > 1 ? (
                <nav aria-label="Search results pages" className="mt-10 flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === page ? 'solid' : 'outline'}
                        size="sm"
                        aria-current={pageNumber === page ? 'page' : undefined}
                        onClick={() => goToPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </nav>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <QuickViewDrawer product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
