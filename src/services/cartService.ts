import { cartRepository } from '@/repositories/cartRepository';
import { inventoryRepository } from '@/repositories/inventoryRepository';
import { productRepository } from '@/repositories/productRepository';
import { addressService } from '@/services/addressService';
import { discountService } from '@/services/discountService';
import { shippingService } from '@/services/shippingService';
import { taxService } from '@/services/taxService';
import { analyticsService } from '@/services/analyticsService';
import type { Cart, Money } from '@/types/domain';

const CART_ID_STORAGE_KEY = 'hf.cartId';

function readStoredCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CART_ID_STORAGE_KEY);
}

function storeCartId(cartId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_ID_STORAGE_KEY, cartId);
}

export interface CartService {
  getCart(profileId: string | null): Promise<Cart>;
  addItem(profileId: string | null, variantId: string, quantity?: number): Promise<Cart>;
  updateItemQuantity(profileId: string | null, itemId: string, quantity: number): Promise<Cart>;
  removeItem(profileId: string | null, itemId: string): Promise<Cart>;
  clearCart(profileId: string | null): Promise<Cart>;
  applyDiscountCode(profileId: string | null, code: string): Promise<Cart>;
  removeDiscountCode(profileId: string | null): Promise<Cart>;
}

class SupabaseCartService implements CartService {
  /**
   * Every public method funnels its result through here before returning,
   * so discount/shipping/tax/total are always freshly computed from the
   * database and the current subtotal — never a client-supplied or stale
   * persisted amount (see Batch 10: "Never trust price, discount,
   * inventory, totals from the browser").
   */
  private async enrich(cart: Cart, profileId: string | null): Promise<Cart> {
    if (cart.items.length === 0) {
      return { ...cart, discount: { cents: 0, currency: cart.currency }, shippingEstimate: null, taxEstimate: null, total: cart.subtotal };
    }

    let discount: Money = { cents: 0, currency: cart.currency };
    let freeShipping = false;
    if (cart.discountCode) {
      const result = await discountService.validateCode(cart.discountCode, cart.id);
      if (result.valid) {
        discount = { cents: result.discountCents, currency: cart.currency };
        freeShipping = result.freeShipping;
      }
    }

    const afterDiscount: Money = { cents: Math.max(0, cart.subtotal.cents - discount.cents), currency: cart.currency };

    const address = await this.getEstimateAddress(profileId);
    const shippingRate = freeShipping
      ? null
      : await shippingService.getCheapestEligibleRate(afterDiscount, address?.country ?? null, address?.city ?? null);
    const shippingEstimate: Money | null = freeShipping ? { cents: 0, currency: cart.currency } : shippingRate ? shippingRate.price : null;

    const taxEstimate = address
      ? await taxService.estimate(address.country, address.region, afterDiscount, shippingEstimate)
      : null;

    const total: Money = {
      cents: afterDiscount.cents + (shippingEstimate?.cents ?? 0) + (taxEstimate?.cents ?? 0),
      currency: cart.currency,
    };

    return { ...cart, discount, shippingEstimate, taxEstimate, total };
  }

  private async getEstimateAddress(profileId: string | null): Promise<{ country: string; region: string | null; city: string } | null> {
    if (!profileId) return null;
    const addresses = await addressService.listForCustomer(profileId);
    const shipping = addresses.find((a) => a.type === 'shipping' && a.isDefault) ?? addresses.find((a) => a.type === 'shipping');
    return shipping ? { country: shipping.country, region: shipping.region, city: shipping.city } : null;
  }

  async getCart(profileId: string | null): Promise<Cart> {
    const cart = await cartRepository.getOrCreate(readStoredCartId(), profileId);
    storeCartId(cart.id);
    return this.enrich(cart, profileId);
  }

  async addItem(profileId: string | null, variantId: string, quantity = 1): Promise<Cart> {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1.');
    }

    // Re-fetch the variant + its product's live status rather than trusting
    // whatever the caller already had loaded — see Batch 9: "Do not trust
    // browser-supplied prices" (the same principle extends to existence/
    // availability, not just price).
    const found = await productRepository.getVariantForCart(variantId);
    if (!found) {
      throw new Error('This product variant no longer exists.');
    }
    if (found.productStatus !== 'active') {
      throw new Error('This product is no longer available.');
    }
    if (!found.variant.isActive) {
      throw new Error('This variant is no longer available.');
    }

    const inventory = await inventoryRepository.getByVariantId(variantId);
    if (!inventory || inventory.available < quantity) {
      throw new Error('Not enough stock available for this variant.');
    }

    const cart = await this.getCart(profileId);
    const existing = cart.items.find((item) => item.variantId === variantId);
    const requestedTotal = (existing?.quantity ?? 0) + quantity;
    if (inventory.available < requestedTotal) {
      throw new Error('Not enough stock available for this variant.');
    }

    const updated = await cartRepository.addItem(cart.id, variantId, quantity);
    void analyticsService.trackAddToCart(variantId, quantity);
    return this.enrich(updated, profileId);
  }

  async updateItemQuantity(profileId: string | null, itemId: string, quantity: number): Promise<Cart> {
    if (quantity > 0) {
      const item = await cartRepository.getItem(itemId);
      if (!item) {
        throw new Error('This cart item no longer exists.');
      }
      const inventory = await inventoryRepository.getByVariantId(item.variantId);
      if (!inventory || inventory.available < quantity) {
        throw new Error('Not enough stock available for this variant.');
      }
    }

    const cart = await this.getCart(profileId);
    const updated = await cartRepository.updateItemQuantity(cart.id, itemId, quantity);
    return this.enrich(updated, profileId);
  }

  async removeItem(profileId: string | null, itemId: string): Promise<Cart> {
    const cart = await this.getCart(profileId);
    const removedItem = cart.items.find((item) => item.id === itemId);
    const updated = await cartRepository.removeItem(cart.id, itemId);
    if (removedItem) void analyticsService.trackRemoveFromCart(removedItem.variantId);
    return this.enrich(updated, profileId);
  }

  async clearCart(profileId: string | null): Promise<Cart> {
    const cart = await this.getCart(profileId);
    const updated = await cartRepository.clear(cart.id);
    return this.enrich(updated, profileId);
  }

  async applyDiscountCode(profileId: string | null, code: string): Promise<Cart> {
    const trimmed = code.trim();
    if (!trimmed) {
      throw new Error('Enter a discount code.');
    }
    const cart = await this.getCart(profileId);
    const result = await discountService.validateCode(trimmed, cart.id);
    if (!result.valid) {
      throw new Error(result.message ?? 'Invalid discount code.');
    }
    const updated = await cartRepository.setDiscountCode(cart.id, trimmed);
    return this.enrich(updated, profileId);
  }

  async removeDiscountCode(profileId: string | null): Promise<Cart> {
    const cart = await this.getCart(profileId);
    const updated = await cartRepository.removeDiscountCode(cart.id);
    return this.enrich(updated, profileId);
  }
}

export const cartService: CartService = new SupabaseCartService();
