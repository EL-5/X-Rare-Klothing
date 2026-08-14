/**
 * `analytics_events` was in Batch 1's placeholder schema but was **not**
 * part of the Batch 2 table list the user specified, so it doesn't exist in
 * the real database (verified: 37 tables live, no `analytics_events`). This
 * service keeps the interface Batch 1's architecture calls for, as a
 * dev-console no-op, so call sites don't have to change when a real
 * implementation (a future migration, or a third-party tool) lands.
 */
export interface AnalyticsService {
  track(name: string, payload?: Record<string, unknown>): Promise<void>;
  trackPageView(path: string): Promise<void>;
  trackProductView(productId: string): Promise<void>;
  trackAddToCart(variantId: string, quantity: number): Promise<void>;
}

class NoopAnalyticsService implements AnalyticsService {
  async track(name: string, payload: Record<string, unknown> = {}): Promise<void> {
    if (import.meta.env.DEV) {
      console.debug('[analytics]', name, payload);
    }
  }

  trackPageView(path: string): Promise<void> {
    return this.track('page_view', { path });
  }

  trackProductView(productId: string): Promise<void> {
    return this.track('product_view', { productId });
  }

  trackAddToCart(variantId: string, quantity: number): Promise<void> {
    return this.track('add_to_cart', { variantId, quantity });
  }
}

export const analyticsService: AnalyticsService = new NoopAnalyticsService();
