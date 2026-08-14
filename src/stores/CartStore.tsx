import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cartService } from '@/services/cartService';
import { useAuth } from '@/stores/AuthStore';
import type { Cart } from '@/types/domain';

interface CartStoreValue {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  itemCount: number;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscountCode: (code: string) => Promise<void>;
  removeDiscountCode: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartStoreValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading: isAuthLoading } = useAuth();
  const profileId = profile?.id ?? null;

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCart(await cartService.getCart(profileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart.');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    // Wait for the initial auth check so a signed-in shopper's cart is
    // claimed by profile_id on first load instead of briefly fetching a
    // fresh guest cart — see cartRepository.getOrCreate.
    if (isAuthLoading) return;
    void refresh();
  }, [refresh, isAuthLoading]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setError(null);
      try {
        setCart(await cartService.addItem(profileId, variantId, quantity));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add item to cart.');
        throw err;
      }
    },
    [profileId],
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      setError(null);
      try {
        setCart(await cartService.updateItemQuantity(profileId, itemId, quantity));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update quantity.');
        throw err;
      }
    },
    [profileId],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setError(null);
      try {
        setCart(await cartService.removeItem(profileId, itemId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove item.');
        throw err;
      }
    },
    [profileId],
  );

  const clearCart = useCallback(async () => {
    setError(null);
    try {
      setCart(await cartService.clearCart(profileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart.');
      throw err;
    }
  }, [profileId]);

  const applyDiscountCode = useCallback(
    async (code: string) => {
      setError(null);
      try {
        setCart(await cartService.applyDiscountCode(profileId, code));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to apply discount code.');
        throw err;
      }
    },
    [profileId],
  );

  const removeDiscountCode = useCallback(async () => {
    setError(null);
    try {
      setCart(await cartService.removeDiscountCode(profileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove discount code.');
      throw err;
    }
  }, [profileId]);

  const itemCount = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart],
  );

  const value = useMemo<CartStoreValue>(
    () => ({
      cart,
      isLoading,
      error,
      itemCount,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      applyDiscountCode,
      removeDiscountCode,
      refresh,
    }),
    [cart, isLoading, error, itemCount, addItem, updateItemQuantity, removeItem, clearCart, applyDiscountCode, removeDiscountCode, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartStoreValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
