import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { wishlistService } from '@/services/wishlistService';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/stores/AuthStore';

interface WishlistStoreValue {
  productIds: Set<string>;
  isLoading: boolean;
  isSaved: (productId: string) => boolean;
  /** Adds if not saved, removes if already saved. No-op (throws) when signed out — callers should gate on isAuthenticated first. */
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistStoreValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading: isAuthLoading } = useAuth();
  const profileId = profile?.id ?? null;

  // Maps productId -> wishlist_items.id, so removal doesn't need a lookup.
  const [itemIdByProduct, setItemIdByProduct] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profileId) {
      setItemIdByProduct(new Map());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const items = await wishlistService.list(profileId);
      setItemIdByProduct(new Map(items.map((item) => [item.productId, item.id])));
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (isAuthLoading) return;
    void refresh();
  }, [refresh, isAuthLoading]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!profileId) throw new Error('Log in to save items to your wishlist.');
      const existingItemId = itemIdByProduct.get(productId);
      if (existingItemId) {
        await wishlistService.remove(existingItemId);
        setItemIdByProduct((prev) => {
          const next = new Map(prev);
          next.delete(productId);
          return next;
        });
      } else {
        const created = await wishlistService.add(profileId, productId);
        setItemIdByProduct((prev) => new Map(prev).set(productId, created.id));
        void analyticsService.trackWishlistAdd(productId);
      }
    },
    [profileId, itemIdByProduct],
  );

  const isSaved = useCallback((productId: string) => itemIdByProduct.has(productId), [itemIdByProduct]);

  const value = useMemo<WishlistStoreValue>(
    () => ({ productIds: new Set(itemIdByProduct.keys()), isLoading, isSaved, toggle, refresh }),
    [itemIdByProduct, isLoading, isSaved, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistStoreValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
