import { inventoryRepository, type InventoryLevelWithVariant } from '@/repositories/inventoryRepository';
import type { InventoryLevel } from '@/types/domain';

export interface InventoryService {
  getAvailability(variantId: string): Promise<InventoryLevel | null>;
  getAvailabilityForVariants(variantIds: string[]): Promise<InventoryLevel[]>;
  isInStock(variantId: string, quantity?: number): Promise<boolean>;
  reserve(variantId: string, quantity: number): Promise<InventoryLevel>;
  release(variantId: string, quantity: number): Promise<InventoryLevel>;
  listAllForAdmin(): Promise<InventoryLevelWithVariant[]>;
  adjustOnHand(variantId: string, delta: number, reason?: string): Promise<InventoryLevel>;
  restock(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel>;
  recordReturn(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel>;
}

class SupabaseInventoryService implements InventoryService {
  getAvailability(variantId: string): Promise<InventoryLevel | null> {
    return inventoryRepository.getByVariantId(variantId);
  }

  getAvailabilityForVariants(variantIds: string[]): Promise<InventoryLevel[]> {
    return inventoryRepository.getByVariantIds(variantIds);
  }

  async isInStock(variantId: string, quantity = 1): Promise<boolean> {
    const level = await inventoryRepository.getByVariantId(variantId);
    return (level?.available ?? 0) >= quantity;
  }

  reserve(variantId: string, quantity: number): Promise<InventoryLevel> {
    return inventoryRepository.reserve(variantId, quantity);
  }

  release(variantId: string, quantity: number): Promise<InventoryLevel> {
    return inventoryRepository.release(variantId, quantity);
  }

  listAllForAdmin(): Promise<InventoryLevelWithVariant[]> {
    return inventoryRepository.listAllWithVariantInfo();
  }

  adjustOnHand(variantId: string, delta: number, reason?: string): Promise<InventoryLevel> {
    return inventoryRepository.adjustOnHand(variantId, delta, reason);
  }

  restock(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel> {
    return inventoryRepository.restock(variantId, quantity, reason);
  }

  recordReturn(variantId: string, quantity: number, reason?: string): Promise<InventoryLevel> {
    return inventoryRepository.recordReturn(variantId, quantity, reason);
  }
}

export const inventoryService: InventoryService = new SupabaseInventoryService();
