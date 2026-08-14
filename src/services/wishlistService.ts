import { wishlistRepository, type WishlistItemWithProduct } from '@/repositories/wishlistRepository';
import { cartService } from '@/services/cartService';
import type { WishlistItem } from '@/types/domain';

export interface WishlistService {
  list(profileId: string): Promise<WishlistItem[]>;
  listWithProducts(profileId: string): Promise<WishlistItemWithProduct[]>;
  add(profileId: string, productId: string, variantId?: string | null): Promise<WishlistItem>;
  remove(itemId: string): Promise<void>;
  /** Adds the item's cheapest in-stock variant to the cart, then removes it from the wishlist. Throws if nothing is currently in stock. */
  moveToCart(profileId: string, item: WishlistItemWithProduct): Promise<void>;
}

class SupabaseWishlistService implements WishlistService {
  list(profileId: string): Promise<WishlistItem[]> {
    return wishlistRepository.listItems(profileId);
  }

  listWithProducts(profileId: string): Promise<WishlistItemWithProduct[]> {
    return wishlistRepository.listItemsWithProducts(profileId);
  }

  add(profileId: string, productId: string, variantId: string | null = null): Promise<WishlistItem> {
    return wishlistRepository.addItem(profileId, productId, variantId);
  }

  remove(itemId: string): Promise<void> {
    return wishlistRepository.removeItem(itemId);
  }

  async moveToCart(profileId: string, item: WishlistItemWithProduct): Promise<void> {
    const variantId = item.product?.availableVariantId;
    if (!variantId) {
      throw new Error('This item is currently out of stock.');
    }
    await cartService.addItem(profileId, variantId, 1);
    await wishlistRepository.removeItem(item.id);
  }
}

export const wishlistService: WishlistService = new SupabaseWishlistService();
