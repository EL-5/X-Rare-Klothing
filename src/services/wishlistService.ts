import { wishlistRepository, type WishlistItemWithProduct } from '@/repositories/wishlistRepository';
import type { WishlistItem } from '@/types/domain';

export interface WishlistService {
  list(profileId: string): Promise<WishlistItem[]>;
  listWithProducts(profileId: string): Promise<WishlistItemWithProduct[]>;
  add(profileId: string, productId: string, variantId?: string | null): Promise<WishlistItem>;
  remove(itemId: string): Promise<void>;
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
}

export const wishlistService: WishlistService = new SupabaseWishlistService();
