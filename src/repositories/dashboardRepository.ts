import { supabase } from '@/lib/supabase';

export interface DashboardOrderRow {
  id: string;
  status: string;
  total_cents: number;
  placed_at: string;
}

export interface DashboardOrderItemRow {
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  total_cents: number;
}

/**
 * Admin dashboard metrics are aggregated client-side from raw rows fetched
 * within the requested date range, rather than a SQL view/RPC — pragmatic
 * given current data volume. If order volume grows large enough for this
 * to matter, move these aggregations into Postgres (materialized view or
 * RPC) instead of scaling the row-fetch further.
 */
export const dashboardRepository = {
  async getOrdersInRange(startISO: string, endISO: string): Promise<DashboardOrderRow[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_cents, placed_at')
      .gte('placed_at', startISO)
      .lte('placed_at', endISO);
    if (error) throw error;
    return data ?? [];
  },

  async getOrderItemsForOrders(orderIds: string[]): Promise<DashboardOrderItemRow[]> {
    if (orderIds.length === 0) return [];
    const { data, error } = await supabase
      .from('order_items')
      .select('order_id, product_id, product_name, quantity, total_cents')
      .in('order_id', orderIds);
    if (error) throw error;
    return data ?? [];
  },

  async getProductCategoryMap(productIds: string[]): Promise<Map<string, string>> {
    if (productIds.length === 0) return new Map();
    const { data, error } = await supabase.from('products').select('id, category_id').in('id', productIds);
    if (error) throw error;

    const categoryIds = [...new Set((data ?? []).map((p) => p.category_id).filter((id): id is string => Boolean(id)))];
    if (categoryIds.length === 0) return new Map();

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);
    if (categoriesError) throw categoriesError;

    const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]));
    const productToCategoryName = new Map<string, string>();
    for (const product of data ?? []) {
      if (product.category_id) {
        const name = categoryNameById.get(product.category_id);
        if (name) productToCategoryName.set(product.id, name);
      }
    }
    return productToCategoryName;
  },

  async countNewCustomersInRange(startISO: string, endISO: string): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startISO)
      .lte('created_at', endISO);
    if (error) throw error;
    return count ?? 0;
  },

  async countPendingOrders(): Promise<number> {
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'payment_pending']);
    if (error) throw error;
    return count ?? 0;
  },

  async countPendingPayments(): Promise<number> {
    const { count, error } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (error) throw error;
    return count ?? 0;
  },

  async getStockCounts(): Promise<{ lowStock: number; outOfStock: number }> {
    const { data, error } = await supabase.from('inventory').select('available, low_stock_threshold');
    if (error) throw error;

    let lowStock = 0;
    let outOfStock = 0;
    for (const row of data ?? []) {
      if (row.available <= 0) outOfStock += 1;
      else if (row.available <= row.low_stock_threshold) lowStock += 1;
    }
    return { lowStock, outOfStock };
  },
};
