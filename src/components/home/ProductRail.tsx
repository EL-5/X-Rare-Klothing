import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types/domain';
import { cn } from '@/lib/cn';

export interface ProductRailProps {
  heading: string;
  viewAllHref?: string;
  products: Product[] | null;
  /** First rail on the page gets eager-loaded images; every later rail lazy-loads (see PERFORMANCE requirements). */
  priority?: boolean;
}

/**
 * Horizontally drag-to-scroll product rail — mirrors the reference's
 * Flickity-powered homepage carousels (see docs/animation-inventory.md:
 * "drag-to-scroll horizontally, not a fixed grid"). Implemented with native
 * scroll-snap + pointer drag instead of pulling in a carousel dependency.
 */
export function ProductRail({ heading, viewAllHref, products, priority = false }: ProductRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (products && products.length === 0) return null;

  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 py-[var(--spacing-section-mobile)] lg:px-8 lg:py-[var(--spacing-section-desktop)]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase leading-[1.2] tracking-wide text-ink">{heading}</h2>
        <div className="flex items-center gap-4">
          {viewAllHref ? (
            <Link to={viewAllHref} className="text-xs uppercase tracking-wide text-ink/60 transition-colors hover:text-ink">
              View All
            </Link>
          ) : null}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollByAmount(-1)}
              className="flex h-8 w-8 items-center justify-center border border-border text-ink/60 transition-colors hover:border-ink hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollByAmount(1)}
              className="flex h-8 w-8 items-center justify-center border border-border text-ink/60 transition-colors hover:border-ink hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className={cn(
          'flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {products === null
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="w-[65%] shrink-0 snap-start sm:w-[42%] lg:w-[23%]">
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </div>
            ))
          : products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={priority && index < 2}
                className="w-[65%] shrink-0 snap-start sm:w-[42%] lg:w-[23%]"
              />
            ))}
      </div>
    </section>
  );
}
