/**
 * `notifications` was in Batch 1's placeholder schema but was **not** part
 * of the Batch 2 table list the user specified, so it doesn't exist in the
 * real database (verified: 37 tables live, no `notifications`). This
 * service keeps the interface Batch 1's architecture calls for, as a
 * no-op, so call sites don't have to change when a real implementation
 * (a future migration, or a third-party provider like Klaviyo/OneSignal)
 * lands — swap the class body, not the callers.
 */
export interface NotificationService {
  notifyOrderConfirmation(customerId: string, orderId: string): Promise<void>;
  notifyBackInStock(customerId: string, productId: string): Promise<void>;
}

class NoopNotificationService implements NotificationService {
  async notifyOrderConfirmation(customerId: string, orderId: string): Promise<void> {
    if (import.meta.env.DEV) {
      console.debug('[notifications] order confirmation (no-op)', { customerId, orderId });
    }
  }

  async notifyBackInStock(customerId: string, productId: string): Promise<void> {
    if (import.meta.env.DEV) {
      console.debug('[notifications] back in stock (no-op)', { customerId, productId });
    }
  }
}

export const notificationService: NotificationService = new NoopNotificationService();
