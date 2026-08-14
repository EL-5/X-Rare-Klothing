import { useEffect, useState } from 'react';
import { ProductRail } from './ProductRail';
import { productService } from '@/services/productService';
import { ROUTES } from '@/config/routes';
import type { Product } from '@/types/domain';

/** Sourced from the "Featured Products" collection — fully admin-curatable via /admin/collections (see Batch 5). */
export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    productService.list({ collectionSlug: 'featured', pageSize: 12 }).then((result) => setProducts(result.items));
  }, []);

  return <ProductRail heading="More Featured Products" viewAllHref={ROUTES.collection('featured')} products={products} />;
}
