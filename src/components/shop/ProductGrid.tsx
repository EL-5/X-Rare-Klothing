import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types/domain';

export interface ProductGridProps {
  products: Product[] | null;
  isProductInStock?: (product: Product) => boolean;
  onQuickView?: (product: Product) => void;
}

/** 2-up mobile / 4-up desktop — matches the reference's grid (see docs/design-system.md: "small-up-2 medium-up-4"). */
export function ProductGrid({ products, isProductInStock, onQuickView }: ProductGridProps) {
  if (products && products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <p className="text-sm text-ink">No products match these filters.</p>
        <p className="text-sm text-ink/60">Try removing a filter or clearing them all.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
      {products === null
        ? Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[4/5] w-full" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))
        : products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              inStock={isProductInStock ? isProductInStock(product) : undefined}
              onQuickView={onQuickView}
            />
          ))}
    </div>
  );
}
