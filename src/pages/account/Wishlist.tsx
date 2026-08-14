import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/stores/AuthStore';
import { wishlistService } from '@/services/wishlistService';
import { ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/Skeleton';
import type { WishlistItemWithProduct } from '@/repositories/wishlistRepository';

export function Wishlist() {
  const { profile } = useAuth();
  const [items, setItems] = useState<WishlistItemWithProduct[] | null>(null);

  const load = async () => {
    if (!profile) return;
    setItems(await wishlistService.listWithProducts(profile.id));
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleRemove = async (itemId: string) => {
    await wishlistService.remove(itemId);
    await load();
  };

  return (
    <div>
      <h1 className="text-xl font-semibold uppercase tracking-wide text-ink">Wishlist</h1>

      {items === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60">Nothing saved yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              {item.product ? (
                <Link to={ROUTES.product(item.product.slug)} className="block">
                  <div className="aspect-[3/4] w-full bg-surface-muted" />
                  <p className="mt-2 text-sm font-medium text-ink">{item.product.title}</p>
                </Link>
              ) : (
                <p className="text-sm text-ink/50">Product no longer available</p>
              )}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="mt-1 text-xs text-ink/50 underline-offset-2 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
