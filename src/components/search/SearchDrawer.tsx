import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { searchService } from '@/services/searchService';
import type { SearchResult } from '@/types/domain';
import { ROUTES } from '@/config/routes';
import { formatMoney } from '@/utils/money';
import { cn } from '@/lib/cn';

export interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const resultRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const { recent, record } = useRecentSearches();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedQuery.trim()) {
      setResult(null);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    searchService
      .search(debouncedQuery)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setActiveIndex(-1);
          record(debouncedQuery);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isOpen, record]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResult(null);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex >= 0) resultRefs.current[activeIndex]?.focus();
  }, [activeIndex]);

  const products = result?.products ?? [];

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLAnchorElement>) => {
    if (products.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % products.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + products.length) % products.length);
    } else if (event.key === 'Enter' && activeIndex === -1) {
      const product = products[0];
      if (product) {
        onClose();
        navigate(ROUTES.product(product.slug));
      }
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Search">
      <div className="p-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
          <Input
            type="search"
            autoFocus
            role="combobox"
            aria-expanded={products.length > 0}
            aria-controls="search-results-list"
            placeholder="Search for anything"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            className="pl-10"
          />
        </div>

        {!debouncedQuery.trim() && recent.length > 0 ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-ink/60">Recent Searches</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-ink/70 hover:border-ink hover:text-ink"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          {isLoading ? (
            <p className="text-sm text-ink/60">Searching…</p>
          ) : !debouncedQuery.trim() ? null : result && result.products.length === 0 ? (
            <p className="text-sm text-ink/60">
              No results found for “{result.query}”. Check the spelling or use a different word or phrase.
            </p>
          ) : result ? (
            <>
              <p className="mb-3 text-xs uppercase tracking-wide text-ink/60">
                {result.total} result{result.total === 1 ? '' : 's'} found
              </p>
              <ul id="search-results-list" role="listbox" className="flex flex-col gap-4">
                {result.products.map((product, index) => (
                  <motion.li
                    key={product.id}
                    role="option"
                    aria-selected={activeIndex === index}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: prefersReducedMotion ? 0 : index * 0.04 }}
                  >
                    <Link
                      ref={(el) => {
                        resultRefs.current[index] = el;
                      }}
                      to={ROUTES.product(product.slug)}
                      onClick={onClose}
                      onKeyDown={handleInputKeyDown}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex items-center gap-3 rounded-sm p-1.5 -mx-1.5 outline-none transition-colors',
                        activeIndex === index ? 'bg-surface-muted' : null,
                      )}
                    >
                      <div className="h-16 w-12 shrink-0 overflow-hidden bg-surface-muted">
                        {product.images[0] ? (
                          <img src={product.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{product.title}</p>
                        <p className="text-xs text-ink/60">{formatMoney(product.price)}</p>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              {result.total > result.products.length ? (
                <Link
                  to={`${ROUTES.search}?q=${encodeURIComponent(result.query)}`}
                  onClick={onClose}
                  className="mt-6 block text-center text-xs uppercase tracking-wide text-ink underline-offset-4 hover:underline"
                >
                  View all {result.total} results
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
}
