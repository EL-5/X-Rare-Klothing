import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer } from '@/components/ui/Drawer';
import { Button, buttonClassNames } from '@/components/ui/Button';
import { VariantSelector } from './VariantSelector';
import { useVariantSelection } from '@/hooks/useVariantSelection';
import { useCart } from '@/stores/CartStore';
import { useToast } from '@/stores/ToastStore';
import { ROUTES } from '@/config/routes';
import { formatMoney } from '@/utils/money';
import type { Product } from '@/types/domain';

export interface QuickViewDrawerProps {
  product: Product | null;
  onClose: () => void;
}

/** SidePanel in "product-drawer" mode — full variant selection + pricing without leaving the page (see docs/component-inventory.md). */
export function QuickViewDrawer({ product, onClose }: QuickViewDrawerProps) {
  const { addItem } = useCart();
  const { show } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const selection = useVariantSelection(product);
  const { activeVariant } = selection;

  const handleAddToCart = async () => {
    if (!activeVariant) return;
    setIsAdding(true);
    try {
      await addItem(activeVariant.id, 1);
      show({ title: 'Added to cart', description: product?.title, variant: 'success' });
      onClose();
    } catch (err) {
      show({ title: 'Could not add to cart', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Drawer isOpen={product !== null} onClose={onClose} title="Quick View">
      {product ? (
        <div className="flex flex-col p-6">
          <div className="aspect-[4/5] w-full overflow-hidden bg-surface-muted">
            {(activeVariant?.image ?? product.images[0]) ? (
              <img src={activeVariant?.image ?? product.images[0]} alt={product.title} className="h-full w-full object-cover" />
            ) : null}
          </div>

          <h2 className="mt-4 text-sm uppercase tracking-wide text-ink">{product.title}</h2>
          <p className="mt-1 text-sm text-ink">
            {product.compareAtPrice && product.compareAtPrice.cents > product.price.cents ? (
              <span className="mr-2 text-ink/40 line-through">{formatMoney(product.compareAtPrice)}</span>
            ) : null}
            {formatMoney(activeVariant?.price ?? product.price)}
          </p>

          <div className="mt-4">
            <VariantSelector selection={selection} />
          </div>

          <Button className="mt-6 w-full" size="lg" isLoading={isAdding} disabled={!activeVariant || !activeVariant.isActive} onClick={handleAddToCart}>
            {activeVariant && !activeVariant.isActive ? 'Sold Out' : !activeVariant ? 'Select Options' : 'Add to Cart'}
          </Button>

          <Link to={ROUTES.product(product.slug)} onClick={onClose} className={buttonClassNames({ variant: 'outline', size: 'lg' }, 'mt-3 w-full')}>
            View Full Details
          </Link>
        </div>
      ) : null}
    </Drawer>
  );
}
