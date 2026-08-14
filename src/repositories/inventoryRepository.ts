import { supabase } from '@/lib/supabase';
import type { InventoryLevel } from '@/types/domain';
import type { InventoryMovementType } from '@/types/database';
import { mapInventoryLevel } from './mappers';

export interface InventoryLevelWithVariant extends InventoryLevel {
  variantSku: string;
  productName: string;
  /** Lifetime units sold — summed from the `inventory_movements` ledger's `sale` entries, not a separate counter. */
  sold: number;
}

async function recordMovement(
  variantId: string,
  type: InventoryMovementType,
  quantity: number,
  reason?: string,
): Promise<InventoryLevel> {
  const { error } = await supabase
    .from('inventory_movements')
    .insert({ variant_id: variantId, type, quantity, reason: reason ?? null });
  if (error) throw error;

  const level = await inventoryRepository.getByVariantId(variantId);
  if (!level) throw new Error('Inventory row missing after movement.');
  return level;
}

/**
 * All writes go through `inventory_movements` — the trigger on that table
 * is the only thing allowed to derive the `inventory` snapshot, so
 * on_hand/reserved/available can never drift from the ledger (see
 * docs/database.md). Never `UPDATE inventory` directly.
 */
export const inventoryRepository = {
  async getByVariantId(variantId: string): Promise<InventoryLevel | null> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('variant_id', variantId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapInventoryLevel(data) : null;
  },

  async getByVariantIds(variantIds: string[]): Promise<InventoryLevel[]> {
    if (variantIds.length === 0) return [];
    const { data, error } = await supabase.from('inventory').select('*').in('variant_id', variantIds);
    if (error) throw error;
    return (data ?? []).map(mapInventoryLevel);
  },

  /** Admin inventory table view: every variant with its current stock level. */
  async listAllWithVariantInfo(): Promise<InventoryLevelWithVariant[]> {
    const { data: inventoryRows, error } = await supabase
      .from('inventory')
      .select('*')
      .order('available', { ascending: true });
    if (error) throw error;
    if (!inventoryRows || inventoryRows.length === 0) return [];

    const variantIds = inventoryRows.map((row) => row.variant_id);
    const { data: variantRows, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, sku, product_id')
      .in('id', variantIds);
    if (variantsError) throw variantsError;

    const productIds = [...new Set((variantRows ?? []).map((v) => v.product_id))];
    const { data: productRows, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);
    if (productsError) throw productsError;

    const productById = new Map(productRows?.map((p) => [p.id, p.name]));
    const variantById = new Map(variantRows?.map((v) => [v.id, v]));

    const { data: saleMovements, error: salesError } = await supabase
      .from('inventory_movements')
      .select('variant_id, quantity')
      .eq('type', 'sale')
      .in('variant_id', variantIds);
    if (salesError) throw salesError;

    const soldByVariant = new Map<string, number>();
    for (const movement of saleMovements ?? []) {
      soldByVariant.set(movement.variant_id, (soldByVariant.get(movement.variant_id) ?? 0) + Math.abs(movement.quantity));
    }

    return inventoryRows.map((row) => {
      const variant = variantById.get(row.variant_id);
      return {
        ...mapInventoryLevel(row),
        variantSku: variant?.sku ?? 'unknown',
        productName: (variant ? productById.get(variant.product_id) : undefined) ?? 'Unknown product',
        sold: soldByVariant.get(row.variant_id) ?? 0,
      };
    });
  },

  restock(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel> {
    return recordMovement(variantId, 'restock', Math.abs(quantity), reason);
  },

  recordReturn(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel> {
    return recordMovement(variantId, 'return', Math.abs(quantity), reason);
  },

  recordSale(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel> {
    return recordMovement(variantId, 'sale', -Math.abs(quantity), reason);
  },

  /** Signed correction (e.g. stock-take discrepancy); positive or negative. */
  adjustOnHand(variantId: string, delta: number, reason?: string): Promise<InventoryLevel> {
    return recordMovement(variantId, 'adjustment', delta, reason);
  },

  reserve(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel> {
    return recordMovement(variantId, 'reservation', Math.abs(quantity), reason);
  },

  release(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel> {
    return recordMovement(variantId, 'release', Math.abs(quantity), reason);
  },
};
