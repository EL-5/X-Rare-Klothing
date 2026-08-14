import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/stores/CartStore';
import { useToast } from '@/stores/ToastStore';
import { useAuth } from '@/stores/AuthStore';
import { useWishlist } from '@/stores/WishlistStore';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/cn';
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
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { show } = useToast();
  const { isAuthenticated } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const saved = isSaved(product.id);

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

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.login);
      return;
    }
    toggle(product.id).catch((err) => {
      show({ title: 'Could not update wishlist', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    });
  };

  return (
    <div className="flex gap-3">
      <Button className="flex-1" size="lg" isLoading={isAdding} disabled={!variant || isOutOfStock} onClick={handleAddToCart}>
        {!variant ? 'Select Options' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}
      </Button>
      <button
        type="button"
        onClick={handleToggleWishlist}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={saved}
        className="flex h-13 w-13 shrink-0 items-center justify-center border border-ink text-ink transition-colors hover:bg-ink hover:text-surface"
      >
        <Heart className={cn('h-5 w-5', saved ? 'fill-accent text-accent' : '')} />
      </button>
    </div>
  );
}
