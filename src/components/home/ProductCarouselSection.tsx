import { useEffect, useState } from 'react';
import { ProductRail } from './ProductRail';
import { productService } from '@/services/productService';
import type { Product } from '@/types/domain';

export interface ProductCarouselConfig {
  heading: string;
  viewAllHref?: string;
  source: 'collection' | 'category' | 'newest';
  collectionSlug?: string;
  categorySlug?: string;
}

/** Generic replacement for the old BestSellers/NewIn/FeaturedProducts/AccessoriesSection/ExploreMore components — which product to show is admin-configured (homepage_sections.config) instead of one component per source. */
export function ProductCarouselSection({ config }: { config: ProductCarouselConfig }) {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    setProducts(null);
    const params =
      config.source === 'collection'
        ? { collectionSlug: config.collectionSlug, pageSize: 12 }
        : config.source === 'category'
          ? { categorySlug: config.categorySlug, pageSize: 12 }
          : { sortBy: 'newest' as const, pageSize: 12 };
    productService.list(params).then((result) => setProducts(result.items));
  }, [config.source, config.collectionSlug, config.categorySlug]);

  return <ProductRail heading={config.heading} viewAllHref={config.viewAllHref} products={products} />;
}
