import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/stores/AuthStore';
import { useCart } from '@/stores/CartStore';
import { wishlistService } from '@/services/wishlistService';
import { useToast } from '@/stores/ToastStore';
import { ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import { formatMoney } from '@/utils/money';
import type { WishlistItemWithProduct } from '@/repositories/wishlistRepository';

export function Wishlist() {
  const { profile } = useAuth();
  const { refresh: refreshCart } = useCart();
  const { show } = useToast();
  const [items, setItems] = useState<WishlistItemWithProduct[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const load = async () => {
    if (!profile) return;
    setItems(await wishlistService.listWithProducts(profile.id));
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleRemove = async (itemId: string) => {
    setPendingId(itemId);
    try {
      await wishlistService.remove(itemId);
      await load();
    } finally {
      setPendingId(null);
    }
  };

  const handleMoveToCart = async (item: WishlistItemWithProduct) => {
    if (!profile) return;
    setPendingId(item.id);
    try {
      await wishlistService.moveToCart(profile.id, item);
      show({ title: 'Moved to cart', description: item.product?.title, variant: 'success' });
      await Promise.all([load(), refreshCart()]);
    } catch (err) {
      show({ title: 'Could not move to cart', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <AccountPageHeader title="Wishlist" description="Saved pieces for later." />

      {items === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-ink/60">Nothing saved yet.</p>
          <Link to={ROUTES.shop} className="mt-4 inline-block text-sm underline-offset-2 hover:underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : Math.min(index, 12) * 0.05 }}
              className="flex flex-col"
            >
              {item.product ? (
                <>
                  <Link to={ROUTES.product(item.product.slug)} className="group relative block aspect-[3/4] w-full overflow-hidden bg-surface-muted">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-105"
                      />
                    ) : null}
                    {!item.product.isAvailable ? (
                      <span className="absolute left-2 top-2 bg-badge-sold-out px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-surface">
                        Unavailable
                      </span>
                    ) : null}
                  </Link>
                  <Link to={ROUTES.product(item.product.slug)} className="mt-2 text-sm font-medium text-ink">
                    {item.product.title}
                  </Link>
                  <p className="mt-1 text-sm text-ink">
                    {item.product.compareAtPrice ? (
                      <span className="mr-2 text-ink/60 line-through">{formatMoney(item.product.compareAtPrice)}</span>
                    ) : null}
                    {formatMoney(item.product.price)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={!item.product.isAvailable || pendingId === item.id}
                      isLoading={pendingId === item.id}
                      onClick={() => handleMoveToCart(item)}
                    >
                      {item.product.isAvailable ? 'Move to Cart' : 'Out of Stock'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-surface-muted">
                  <p className="px-4 text-center text-sm text-ink/60">Product no longer available</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={pendingId === item.id}
                className="mt-2 self-start text-xs text-ink/60 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
