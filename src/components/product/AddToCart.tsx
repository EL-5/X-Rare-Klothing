import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/stores/CartStore';
import { useToast } from '@/stores/ToastStore';
import type { Product, ProductVariant } from '@/types/domain';

export interface AddToCartProps {
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
  availableQuantity?: number;
}

/**
 * Adds the exact resolved variant — never trusts a client-computed price;
 * cartService re-validates existence/status/stock server-side before the
 * write (see Batch 9: "Do not trust browser-supplied prices").
 */
export function AddToCart({ product, variant, quantity, availableQuantity }: AddToCartProps) {
  const { addItem } = useCart();
  const { show } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = variant ? !variant.isActive || (availableQuantity !== undefined && availableQuantity <= 0) : false;

  const handleAddToCart = async () => {
    if (!variant) return;
    setIsAdding(true);
    try {
      await addItem(variant.id, quantity);
      show({ title: 'Added to cart', description: product.title, variant: 'success' });
    } catch (err) {
      show({ title: 'Could not add to cart', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button className="w-full" size="lg" isLoading={isAdding} disabled={!variant || isOutOfStock} onClick={handleAddToCart}>
      {!variant ? 'Select Options' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}
    </Button>
  );
}
