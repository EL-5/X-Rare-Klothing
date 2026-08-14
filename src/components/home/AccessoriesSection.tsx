import { useEffect, useState } from 'react';
import { ProductRail } from './ProductRail';
import { productService } from '@/services/productService';
import { ROUTES } from '@/config/routes';
import type { Product } from '@/types/domain';

export function AccessoriesSection() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    productService.list({ categorySlug: 'accessories', pageSize: 12 }).then((result) => setProducts(result.items));
  }, []);

  return <ProductRail heading="Accessories" viewAllHref={ROUTES.category('accessories')} products={products} />;
}
