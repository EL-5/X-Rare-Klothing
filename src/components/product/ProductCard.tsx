import { Link, useNavigate } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';
import type { Product } from '@/types/domain';
import { ROUTES } from '@/config/routes';
import { formatMoney } from '@/utils/money';
import { cn } from '@/lib/cn';
import { useAuth } from '@/stores/AuthStore';
import { useWishlist } from '@/stores/WishlistStore';
import { useToast } from '@/stores/ToastStore';

export interface ProductCardProps {
  product: Product;
  /** Marks the image as above-the-fold so it loads eagerly instead of lazily. */
  priority?: boolean;
  /** Real inventory-derived stock state, when the caller has it (see useProductListing). Falls back to the isActive heuristic otherwise. */
  inStock?: boolean;
  /** Renders a "Quick View" hover overlay when provided (shop grid only — see Batch 8). */
  onQuickView?: (product: Product) => void;
  className?: string;
}

/**
 * Reused identically across every homepage rail, the shop grid, and search
 * results (see docs/component-inventory.md — "ProductCard... reused
 * identically across the homepage carousels, collection grids, and search
 * results"). Badge, uppercase title, strikethrough compare-at price, and
 * inline "Available in N colors" swatches all mirror the audited card.
 */
export function ProductCard({ product, priority = false, inStock, onQuickView, className }: ProductCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const { show } = useToast();
  const saved = isSaved(product.id);

  const handleToggleWishlist = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate(ROUTES.login);
      return;
    }
    toggle(product.id).catch((err) => {
      show({ title: 'Could not update wishlist', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    });
  };

  const isSoldOut = inStock !== undefined ? !inStock : product.variants.length > 0 && product.variants.every((variant) => !variant.isActive);
  const isOnSale = product.compareAtPrice !== null && product.compareAtPrice.cents > product.price.cents;
  const savePercent = isOnSale
    ? Math.round((1 - product.price.cents / product.compareAtPrice!.cents) * 100)
    : 0;

  const swatchColors = Array.from(new Set(product.variants.map((v) => v.color).filter((c): c is string => Boolean(c))));
  const secondaryImage = product.images[1];

  return (
    <Link to={ROUTES.product(product.slug)} className={cn('group block', className)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            width={800}
            height={1000}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]',
              secondaryImage ? 'group-hover:opacity-0' : null,
            )}
          />
        ) : null}
        {secondaryImage ? (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            width={800}
            height={1000}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)] group-hover:opacity-100"
          />
        ) : null}

        {isSoldOut ? (
          <span className="absolute left-2 top-2 rounded-[var(--radius-badge)] bg-badge-sold-out px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-surface">
            Sold Out
          </span>
        ) : isOnSale ? (
          <span className="absolute left-2 top-2 rounded-[var(--radius-badge)] bg-badge-sale px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-surface">
            Save {savePercent}%
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={saved}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-ink transition-opacity hover:opacity-80"
        >
          <Heart className={cn('h-4 w-4', saved ? 'fill-accent text-accent' : 'text-ink')} />
        </button>

        {onQuickView ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onQuickView(product);
            }}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-surface/95 py-3 text-xs font-semibold uppercase tracking-wide text-ink opacity-0 transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Eye className="h-3.5 w-3.5" /> Quick View
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <h3 className="text-sm uppercase tracking-wide text-ink">{product.title}</h3>
        <p className="text-sm text-ink">
          {isOnSale ? <span className="mr-2 text-ink/60 line-through">{formatMoney(product.compareAtPrice!)}</span> : null}
          {formatMoney(product.price)}
        </p>
        {swatchColors.length > 0 ? (
          <p className="text-xs text-ink/60">Available in {swatchColors.length} color{swatchColors.length === 1 ? '' : 's'}</p>
        ) : null}
      </div>
    </Link>
  );
}
