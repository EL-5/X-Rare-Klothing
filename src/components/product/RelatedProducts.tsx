import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { productService } from '@/services/productService';
import type { Product } from '@/types/domain';

export interface RelatedProductsProps {
  product: Product;
}

/** "You might also be interested in" — loaded from the product service, never hardcoded (see docs/component-inventory.md). */
export function RelatedProducts({ product }: RelatedProductsProps) {
  const [related, setRelated] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRelated(null);
    productService.getRelated(product).then((items) => {
      if (!cancelled) setRelated(items);
    });
    return () => {
      cancelled = true;
    };
  }, [product]);

  if (related && related.length === 0) return null;

  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 py-[var(--spacing-section-mobile)] lg:px-8 lg:py-[var(--spacing-section-desktop)]">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-wide text-ink">You Might Also Be Interested In</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {related === null
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="mt-3 h-4 w-3/4" />
              </div>
            ))
          : related.map((item) => <ProductCard key={item.id} product={item} />)}
      </div>
    </section>
  );
}
