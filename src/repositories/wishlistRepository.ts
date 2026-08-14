import { supabase } from '@/lib/supabase';
import type { Money, WishlistItem } from '@/types/domain';
import { mapWishlistItem, toMoney } from './mappers';
import { inventoryRepository } from './inventoryRepository';

export interface WishlistProductSummary {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: Money;
  compareAtPrice: Money | null;
  /** False when the product is inactive, or every variant is either inactive or out of stock. */
  isAvailable: boolean;
  /** The cheapest in-stock active variant, if any — what "Move to Cart" adds. */
  availableVariantId: string | null;
}

export interface WishlistItemWithProduct extends WishlistItem {
  product: WishlistProductSummary | null;
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
    if (!itemRows || itemRows.length === 0) return [];

    const productIds = [...new Set(itemRows.map((row) => row.product_id))];

    const [{ data: productRows, error: productsError }, { data: imageRows, error: imagesError }, { data: variantRows, error: variantsError }] =
      await Promise.all([
        supabase.from('products').select('id, slug, name, status').in('id', productIds),
        supabase.from('product_images').select('product_id, url, position').in('product_id', productIds).order('position'),
        supabase.from('product_variants').select('id, product_id, price_cents, compare_at_price_cents, is_active').in('product_id', productIds),
      ]);
    if (productsError) throw productsError;
    if (imagesError) throw imagesError;
    if (variantsError) throw variantsError;

    const inventory = await inventoryRepository.getByVariantIds((variantRows ?? []).map((v) => v.id));
    const availableByVariant = new Map(inventory.map((level) => [level.variantId, level.available]));

    const productById = new Map(productRows?.map((p) => [p.id, p]));
    const imageByProduct = new Map<string, string>();
    for (const img of imageRows ?? []) {
      if (!imageByProduct.has(img.product_id)) imageByProduct.set(img.product_id, img.url);
    }
    const variantsByProduct = new Map<string, typeof variantRows>();
    for (const variant of variantRows ?? []) {
      const list = variantsByProduct.get(variant.product_id) ?? [];
      list.push(variant);
      variantsByProduct.set(variant.product_id, list);
    }

    return itemRows.map((row) => {
      const productRow = productById.get(row.product_id);
      if (!productRow) return { ...mapWishlistItem(row), product: null };

      const variants = variantsByProduct.get(row.product_id) ?? [];
      const inStockVariants = variants.filter((v) => v.is_active && (availableByVariant.get(v.id) ?? 0) > 0);
      const cheapest = (inStockVariants.length > 0 ? inStockVariants : variants).reduce<(typeof variants)[number] | null>(
        (min, v) => (!min || v.price_cents < min.price_cents ? v : min),
        null,
      );

      const product: WishlistProductSummary = {
        id: productRow.id,
        slug: productRow.slug,
        title: productRow.name,
        image: imageByProduct.get(row.product_id) ?? null,
        price: toMoney(cheapest?.price_cents ?? 0, 'USD'),
        compareAtPrice: cheapest?.compare_at_price_cents != null ? toMoney(cheapest.compare_at_price_cents, 'USD') : null,
        isAvailable: productRow.status === 'active' && inStockVariants.length > 0,
        availableVariantId: inStockVariants.length > 0 ? (cheapest?.id ?? null) : null,
      };

      return { ...mapWishlistItem(row), product };
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
