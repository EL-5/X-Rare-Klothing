import { supabase } from '@/lib/supabase';
import type { Cart } from '@/types/domain';
import { mapCart, mapCartItem, mapProduct, type ProductImageRow } from './mappers';

async function buildCart(cartId: string): Promise<Cart> {
  const { data: cartRow, error: cartError } = await supabase
    .from('carts')
    .select('*')
    .eq('id', cartId)
    .single();
  if (cartError) throw cartError;

  const { data: itemRows, error: itemsError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId);
  if (itemsError) throw itemsError;

  const variantIds = (itemRows ?? []).map((row) => row.variant_id);
  if (variantIds.length === 0) return mapCart(cartRow, []);

  // Reads through the masking RPC, not the base table directly — see
  // 0040/0041: cost_cents/barcode are staff-only, and the base table's
  // SELECT grant for anon/authenticated no longer includes them at all.
  const { data: variantRows, error: variantsError } = await supabase.rpc('variants_by_ids', { _ids: variantIds });
  if (variantsError) throw variantsError;

  const productIds = [...new Set((variantRows ?? []).map((v) => v.product_id))];
  const { data: productRows, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);
  if (productsError) throw productsError;

  const { data: imageRows, error: imagesError } = await supabase
    .from('product_images')
    .select('product_id, variant_id, url')
    .in('product_id', productIds)
    .order('position');
  if (imagesError) throw imagesError;

  const imagesByProduct = new Map<string, ProductImageRow[]>();
  for (const row of imageRows ?? []) {
    const existing = imagesByProduct.get(row.product_id) ?? [];
    existing.push({ url: row.url, variantId: row.variant_id });
    imagesByProduct.set(row.product_id, existing);
  }

  const productById = new Map(productRows?.map((p) => [p.id, p]));
  const variantById = new Map(variantRows?.map((v) => [v.id, v]));

  const items = (itemRows ?? []).flatMap((itemRow) => {
    const variantRow = variantById.get(itemRow.variant_id);
    const productRow = variantRow ? productById.get(variantRow.product_id) : undefined;
    if (!variantRow || !productRow) return [];

    const product = mapProduct(productRow, [variantRow], imagesByProduct.get(productRow.id) ?? [], cartRow.currency);
    const variant = product.variants[0];
    if (!variant) return [];

    return [mapCartItem(itemRow, product, variant, cartRow.currency)];
  });

  return mapCart(cartRow, items);
}

/**
 * Folds a guest cart's line items into the customer's already-existing
 * cart, combining quantities for any variant present in both, then deletes
 * the now-empty guest cart. Combined quantities are capped at real
 * inventory availability — a merge should never silently create a
 * backorder past what's actually in stock (see Batch 10: "never trust
 * inventory from the browser," which extends to server-side composition
 * too, not just client input).
 */
async function mergeGuestCartIntoOwned(guestCartId: string, ownedCartId: string): Promise<void> {
  const { data: guestItems, error: guestError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', guestCartId);
  if (guestError) throw guestError;

  if (!guestItems || guestItems.length === 0) {
    const { error } = await supabase.from('carts').delete().eq('id', guestCartId);
    if (error) throw error;
    return;
  }

  const { data: ownedItems, error: ownedError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', ownedCartId);
  if (ownedError) throw ownedError;
  const ownedByVariant = new Map((ownedItems ?? []).map((item) => [item.variant_id, item]));

  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('inventory')
    .select('variant_id, available')
    .in(
      'variant_id',
      guestItems.map((item) => item.variant_id),
    );
  if (inventoryError) throw inventoryError;
  const availableByVariant = new Map((inventoryRows ?? []).map((row) => [row.variant_id, row.available]));

  for (const guestItem of guestItems) {
    const existingOwned = ownedByVariant.get(guestItem.variant_id);
    const available = availableByVariant.get(guestItem.variant_id);
    const combinedQuantity = (existingOwned?.quantity ?? 0) + guestItem.quantity;
    const finalQuantity = available !== undefined ? Math.min(combinedQuantity, available) : combinedQuantity;

    if (finalQuantity <= 0) {
      if (existingOwned) {
        const { error } = await supabase.from('cart_items').delete().eq('id', existingOwned.id);
        if (error) throw error;
      }
      continue;
    }

    if (existingOwned) {
      if (finalQuantity !== existingOwned.quantity) {
        const { error } = await supabase.from('cart_items').update({ quantity: finalQuantity }).eq('id', existingOwned.id);
        if (error) throw error;
      }
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ cart_id: ownedCartId, variant_id: guestItem.variant_id, quantity: finalQuantity });
      if (error) throw error;
    }
  }

  const { error: deleteError } = await supabase.from('carts').delete().eq('id', guestCartId);
  if (deleteError) throw deleteError;
}

export const cartRepository = {
  /**
   * Resolves the shopper's cart. Signed-in shoppers are matched by
   * `profile_id`. If a locally-stored guest cart id is also passed in:
   * - no owned cart yet → that guest cart is "claimed" (profile_id set).
   * - an owned cart already exists → the guest cart is merged into it
   *   (see mergeGuestCartIntoOwned) rather than abandoned.
   * Guests get a fresh cart keyed by a random `session_id` if no valid
   * cart id was passed in.
   */
  async getOrCreate(cartId: string | null, profileId: string | null): Promise<Cart> {
    if (profileId) {
      const { data: owned } = await supabase
        .from('carts')
        .select('id')
        .eq('profile_id', profileId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (owned) {
        if (cartId && cartId !== owned.id) {
          const { data: guestCart } = await supabase.from('carts').select('id, profile_id').eq('id', cartId).maybeSingle();
          if (guestCart && guestCart.profile_id === null) {
            await mergeGuestCartIntoOwned(cartId, owned.id);
          }
        }
        return buildCart(owned.id);
      }

      if (cartId) {
        const { data: guestCart } = await supabase
          .from('carts')
          .select('id, profile_id')
          .eq('id', cartId)
          .maybeSingle();
        if (guestCart && guestCart.profile_id === null) {
          const { error } = await supabase.from('carts').update({ profile_id: profileId }).eq('id', cartId);
          if (error) throw error;
          return buildCart(cartId);
        }
      }

      const { data: created, error } = await supabase
        .from('carts')
        .insert({ profile_id: profileId, currency: 'USD' })
        .select('id')
        .single();
      if (error) throw error;
      return buildCart(created.id);
    }

    if (cartId) {
      const { data } = await supabase.from('carts').select('id').eq('id', cartId).maybeSingle();
      if (data) return buildCart(data.id);
    }

    const { data: created, error } = await supabase
      .from('carts')
      .insert({ session_id: crypto.randomUUID(), currency: 'USD' })
      .select('id')
      .single();
    if (error) throw error;
    return buildCart(created.id);
  },

  async get(cartId: string): Promise<Cart> {
    return buildCart(cartId);
  },

  async addItem(cartId: string, variantId: string, quantity: number): Promise<Cart> {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ cart_id: cartId, variant_id: variantId, quantity });
      if (error) throw error;
    }

    return buildCart(cartId);
  },

  async updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<Cart> {
    if (quantity <= 0) {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
      if (error) throw error;
    }
    return buildCart(cartId);
  },

  async removeItem(cartId: string, itemId: string): Promise<Cart> {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
    if (error) throw error;
    return buildCart(cartId);
  },

  async clear(cartId: string): Promise<Cart> {
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
    if (error) throw error;
    return buildCart(cartId);
  },

  async setDiscountCode(cartId: string, code: string): Promise<Cart> {
    const { error } = await supabase.from('carts').update({ discount_code: code }).eq('id', cartId);
    if (error) throw error;
    return buildCart(cartId);
  },

  async removeDiscountCode(cartId: string): Promise<Cart> {
    const { error } = await supabase.from('carts').update({ discount_code: null }).eq('id', cartId);
    if (error) throw error;
    return buildCart(cartId);
  },

  /** For cartService's item-quantity validation — the itemId identifies a row, not a variant, so callers need the variant_id to check inventory. */
  async getItem(itemId: string): Promise<{ id: string; cartId: string; variantId: string; quantity: number } | null> {
    const { data, error } = await supabase.from('cart_items').select('*').eq('id', itemId).maybeSingle();
    if (error) throw error;
    return data ? { id: data.id, cartId: data.cart_id, variantId: data.variant_id, quantity: data.quantity } : null;
  },
};
