import { useEffect, useState } from 'react';
import { ProductRail } from './ProductRail';
import { productService } from '@/services/productService';
import { ROUTES } from '@/config/routes';
import type { Product } from '@/types/domain';

/** Catch-all rail — newest active products across the whole catalog, not scoped to one collection/category. */
export function ExploreMore() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    productService.list({ sortBy: 'newest', pageSize: 12 }).then((result) => setProducts(result.items));
  }, []);

  return <ProductRail heading="Explore More" viewAllHref={ROUTES.shop} products={products} />;
}
