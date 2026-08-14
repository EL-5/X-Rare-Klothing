import { analyticsRepository } from '@/repositories/analyticsRepository';

/**
 * Privacy-conscious event tracking. See migration 0035_analytics_events.sql
 * for the storage/RLS design. This service owns the browser-local session
 * id (a random, unlinked-to-identity UUID) the same way `cartService` owns
 * the cart id — a browser-storage concern that doesn't belong in the
 * repository layer.
 *
 * Kept as an interface so the concrete implementation (currently: write
 * straight to `analytics_events`) can be swapped for a third-party provider
 * later without touching any call site.
 */
export interface AnalyticsService {
  trackPageView(path: string): Promise<void>;
  trackProductView(productId: string): Promise<void>;
  trackSearch(query: string, resultCount: number): Promise<void>;
  trackAddToCart(variantId: string, quantity: number): Promise<void>;
  trackRemoveFromCart(variantId: string): Promise<void>;
  trackCheckoutStarted(cartTotalCents: number): Promise<void>;
  trackPaymentStarted(orderId: string): Promise<void>;
  trackPurchase(orderId: string, totalCents: number): Promise<void>;
  trackWishlistAdd(productId: string): Promise<void>;
  trackNewsletterSignup(): Promise<void>;
}

const SESSION_ID_STORAGE_KEY = 'hf.analyticsSessionId';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = window.localStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_ID_STORAGE_KEY, id);
  }
  return id;
}

class SupabaseAnalyticsService implements AnalyticsService {
  private track(type: Parameters<typeof analyticsRepository.record>[0], data: Record<string, unknown> = {}): Promise<void> {
    return analyticsRepository.record(type, getSessionId(), data);
  }

  trackPageView(path: string): Promise<void> {
    return this.track('page_view', { path });
  }
  trackProductView(productId: string): Promise<void> {
    return this.track('product_view', { productId });
  }
  trackSearch(query: string, resultCount: number): Promise<void> {
    return this.track('search', { query, resultCount });
  }
  trackAddToCart(variantId: string, quantity: number): Promise<void> {
    return this.track('add_to_cart', { variantId, quantity });
  }
  trackRemoveFromCart(variantId: string): Promise<void> {
    return this.track('remove_from_cart', { variantId });
  }
  trackCheckoutStarted(cartTotalCents: number): Promise<void> {
    return this.track('checkout_started', { cartTotalCents });
  }
  trackPaymentStarted(orderId: string): Promise<void> {
    return this.track('payment_started', { orderId });
  }
  trackPurchase(orderId: string, totalCents: number): Promise<void> {
    return this.track('purchase', { orderId, totalCents });
  }
  trackWishlistAdd(productId: string): Promise<void> {
    return this.track('wishlist', { productId });
  }
  trackNewsletterSignup(): Promise<void> {
    return this.track('newsletter_signup', {});
  }
}

export const analyticsService: AnalyticsService = new SupabaseAnalyticsService();
