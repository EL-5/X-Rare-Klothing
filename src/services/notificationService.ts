import { notificationRepository, type ListNotificationsParams } from '@/repositories/notificationRepository';
import type { Notification, Paginated } from '@/types/domain';

/**
 * Provider-agnostic notification abstraction. Business logic never talks to
 * an email provider directly — it enqueues (via the enqueue_notification
 * SECURITY DEFINER function, called from order/payment/refund/newsletter
 * flows server-side, see migration 0034) and this service only ever reads
 * the resulting queue or asks it to process. Swapping how delivery actually
 * happens (a real provider, once Edge Functions are deployable here) means
 * changing the single simulated-provider block inside
 * process_pending_notifications — nothing in this file or its callers.
 */
export interface NotificationService {
  listForAdmin(params?: ListNotificationsParams): Promise<Paginated<Notification>>;
  /** Stands in for a scheduled worker in this environment — sends (or fails, and logs why) every eligible pending/retriable-failed notification. */
  processQueue(limit?: number): Promise<number>;
}

class SupabaseNotificationService implements NotificationService {
  listForAdmin(params: ListNotificationsParams = {}): Promise<Paginated<Notification>> {
    return notificationRepository.listForAdmin(params);
  }

  processQueue(limit = 50): Promise<number> {
    return notificationRepository.processQueue(limit);
  }
}

export const notificationService: NotificationService = new SupabaseNotificationService();
