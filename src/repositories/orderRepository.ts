import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus, Paginated } from '@/types/domain';
import { mapOrder } from './mappers';

async function fetchOrderItems(orderId: string) {
  const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (error) throw error;
  return data ?? [];
}

async function fetchOrderAddresses(orderId: string) {
  const { data, error } = await supabase.from('order_addresses').select('*').eq('order_id', orderId);
  if (error) throw error;
  return data ?? [];
}

async function fetchOrderPayments(orderId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function hydrateOrder(row: Parameters<typeof mapOrder>[0]): Promise<Order> {
  const [items, addresses, payments] = await Promise.all([
    fetchOrderItems(row.id),
    fetchOrderAddresses(row.id),
    fetchOrderPayments(row.id),
  ]);
  return mapOrder(row, items, addresses, payments);
}

export interface AdminListOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OrderStatus;
}

/**
 * Read-only from the client by design: there is no RLS INSERT policy on
 * `orders`/`order_items` for the `authenticated`/`anon` roles (see
 * docs/database.md and docs/authorization.md) — order creation happens in
 * the checkout Edge Function via the service role, which bypasses RLS.
 * `updateStatus` works because order-staff roles *do* have an UPDATE grant.
 */
export const orderRepository = {
  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return hydrateOrder(data);
  },

  /** Staff-only in practice: RLS only grants order-staff roles a policy-free SELECT across all orders. */
  async listAll(limit = 50): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('placed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Promise.all((data ?? []).map(hydrateOrder));
  },

  async listForAdmin(params: AdminListOrdersParams = {}): Promise<Paginated<Order>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('orders').select('*', { count: 'exact' }).order('placed_at', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.search) {
      const safeQuery = params.search.replace(/[,()]/g, ' ').trim();
      if (safeQuery) query = query.or(`order_number.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const rows = data ?? [];
    const items = await Promise.all(rows.map(hydrateOrder));
    const total = count ?? items.length;

    return { items, total, page, pageSize, hasMore: from + items.length < total };
  },

  async listByCustomer(profileId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('profile_id', profileId)
      .order('placed_at', { ascending: false });
    if (error) throw error;

    return Promise.all((data ?? []).map(hydrateOrder));
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return hydrateOrder(data);
  },

  /** Staff-only via the `order_manager`/`admin`/`super_admin` UPDATE grant on `orders`. */
  async updateInternalNotes(id: string, internalNotes: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ internal_notes: internalNotes || null })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return hydrateOrder(data);
  },

  /** Wraps the cancel_order RPC (migration 0024) — staff-only, checked inside the function itself. */
  async cancel(id: string, reason?: string): Promise<Order> {
    const { error } = await supabase.rpc('cancel_order', { _order_id: id, _reason: reason ?? null });
    if (error) throw new Error(error.message);
    const order = await this.getById(id);
    if (!order) throw new Error('Order not found after cancellation.');
    return order;
  },

  /** Wraps the refund_order RPC (migration 0024) — staff-only, checked inside the function itself. */
  async refund(id: string, amountCents: number, restock: boolean, reason?: string): Promise<Order> {
    const { error } = await supabase.rpc('refund_order', {
      _order_id: id,
      _amount_cents: amountCents,
      _restock: restock,
      _reason: reason ?? null,
    });
    if (error) throw new Error(error.message);
    const order = await this.getById(id);
    if (!order) throw new Error('Order not found after refund.');
    return order;
  },
};
