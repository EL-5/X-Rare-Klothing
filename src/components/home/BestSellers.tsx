import { useEffect, useState } from 'react';
import { ProductRail } from './ProductRail';
import { productService } from '@/services/productService';
import { ROUTES } from '@/config/routes';
import type { Product } from '@/types/domain';

export function BestSellers() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    productService.list({ collectionSlug: 'best-sellers', pageSize: 12 }).then((result) => setProducts(result.items));
  }, []);

  return <ProductRail heading="Best Sellers" viewAllHref={ROUTES.collection('best-sellers')} products={products} />;
}
