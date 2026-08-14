import { useEffect, useState } from 'react';
import { ProductRail } from './ProductRail';
import { productService } from '@/services/productService';
import { ROUTES } from '@/config/routes';
import type { Product } from '@/types/domain';

export function NewIn() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    productService.list({ collectionSlug: 'new-in', pageSize: 12 }).then((result) => setProducts(result.items));
  }, []);

  return <ProductRail heading="New In" viewAllHref={ROUTES.collection('new-in')} products={products} />;
}
