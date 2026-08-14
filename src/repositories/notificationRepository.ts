import { supabase } from '@/lib/supabase';
import type { Notification, NotificationStatus, NotificationType, Paginated } from '@/types/domain';
import { mapNotification } from './mappers';

export interface ListNotificationsParams {
  status?: NotificationStatus;
  type?: NotificationType;
  page?: number;
  pageSize?: number;
}

/** Staff-only in practice — RLS grants order-staff a read on `notifications`; every write goes through the enqueue_notification/process_pending_notifications RPCs, never a direct insert/update. */
export const notificationRepository = {
  async listForAdmin(params: ListNotificationsParams = {}): Promise<Paginated<Notification>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('notifications').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (params.status) query = query.eq('status', params.status);
    if (params.type) query = query.eq('type', params.type);

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const items = (data ?? []).map(mapNotification);
    const total = count ?? items.length;
    return { items, total, page, pageSize, hasMore: from + items.length < total };
  },

  /** Claims and "sends" up to `limit` pending/retriable-failed rows — safe to call repeatedly or concurrently, see migration 0034. Returns how many were processed. */
  async processQueue(limit = 50): Promise<number> {
    const { data, error } = await supabase.rpc('process_pending_notifications', { _limit: limit });
    if (error) throw new Error(error.message);
    return data ?? 0;
  },
};
