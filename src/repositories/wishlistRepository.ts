import { supabase } from '@/lib/supabase';
import type { WishlistItem } from '@/types/domain';
import { mapWishlistItem } from './mappers';

export interface WishlistItemWithProduct extends WishlistItem {
  product: { id: string; slug: string; title: string } | null;
}

async function getOrCreateWishlistId(profileId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('wishlists')
    .insert({ profile_id: profileId })
    .select('id')
    .single();
  if (error) throw error;
  return created.id;
}

export const wishlistRepository = {
  getOrCreateWishlistId,

  async listItems(profileId: string): Promise<WishlistItem[]> {
    const wishlistId = await getOrCreateWishlistId(profileId);
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapWishlistItem);
  },

  async listItemsWithProducts(profileId: string): Promise<WishlistItemWithProduct[]> {
    const wishlistId = await getOrCreateWishlistId(profileId);
    const { data: itemRows, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const productIds = [...new Set((itemRows ?? []).map((row) => row.product_id))];
    if (productIds.length === 0) return [];

    const { data: productRows, error: productsError } = await supabase
      .from('products')
      .select('id, slug, name')
      .in('id', productIds);
    if (productsError) throw productsError;

    const productById = new Map(productRows?.map((p) => [p.id, p]));

    return (itemRows ?? []).map((row) => {
      const product = productById.get(row.product_id);
      return {
        ...mapWishlistItem(row),
        product: product ? { id: product.id, slug: product.slug, title: product.name } : null,
      };
    });
  },

  async addItem(profileId: string, productId: string, variantId: string | null): Promise<WishlistItem> {
    const wishlistId = await getOrCreateWishlistId(profileId);
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({ wishlist_id: wishlistId, product_id: productId, variant_id: variantId })
      .select('*')
      .single();
    if (error) throw error;
    return mapWishlistItem(data);
  },

  async removeItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('wishlist_items').delete().eq('id', itemId);
    if (error) throw error;
  },
};
