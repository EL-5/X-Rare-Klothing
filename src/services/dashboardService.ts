import { dashboardRepository } from '@/repositories/dashboardRepository';
import type { Money } from '@/types/domain';

export interface DashboardMetrics {
  revenue: Money;
  ordersCount: number;
  averageOrderValue: Money;
  newCustomers: number;
  productsSold: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingOrders: number;
  pendingPayments: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface TopEntry {
  name: string;
  value: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  revenueSeries: ChartPoint[];
  ordersSeries: ChartPoint[];
  topProducts: TopEntry[];
  topCategories: TopEntry[];
  ordersByStatus: TopEntry[];
}

/** Order statuses counted as recognized revenue — excludes not-yet-paid and cancelled/refunded orders. */
const REVENUE_STATUSES = new Set(['paid', 'processing', 'ready_for_shipping', 'shipped', 'delivered']);

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export interface DashboardService {
  getDashboardData(startDate: Date, endDate: Date, currency?: string, topLimit?: number): Promise<DashboardData>;
}

class SupabaseDashboardService implements DashboardService {
  async getDashboardData(startDate: Date, endDate: Date, currency = 'USD', topLimit = 5): Promise<DashboardData> {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const [orders, newCustomers, pendingOrders, pendingPayments, stockCounts] = await Promise.all([
      dashboardRepository.getOrdersInRange(startISO, endISO),
      dashboardRepository.countNewCustomersInRange(startISO, endISO),
      dashboardRepository.countPendingOrders(),
      dashboardRepository.countPendingPayments(),
      dashboardRepository.getStockCounts(),
    ]);

    const revenueOrders = orders.filter((o) => REVENUE_STATUSES.has(o.status));
    const revenueCents = revenueOrders.reduce((sum, o) => sum + o.total_cents, 0);
    const ordersCount = orders.length;
    const averageOrderCents = revenueOrders.length > 0 ? Math.round(revenueCents / revenueOrders.length) : 0;

    // Daily series across every day in range, zero-filled so charts don't skip gaps.
    const revenueByDay = new Map<string, number>();
    const ordersByDay = new Map<string, number>();
    for (const order of orders) {
      const key = dayKey(order.placed_at);
      ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
      if (REVENUE_STATUSES.has(order.status)) {
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.total_cents);
      }
    }

    const days: string[] = [];
    const cursor = new Date(startDate);
    cursor.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(endDate);
    endDay.setUTCHours(0, 0, 0, 0);
    while (cursor <= endDay) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const revenueSeries: ChartPoint[] = days.map((d) => ({ label: d, value: (revenueByDay.get(d) ?? 0) / 100 }));
    const ordersSeries: ChartPoint[] = days.map((d) => ({ label: d, value: ordersByDay.get(d) ?? 0 }));

    // Products sold + top products/categories — order_items for revenue-recognized orders only.
    const revenueOrderIds = revenueOrders.map((o) => o.id);
    const items = await dashboardRepository.getOrderItemsForOrders(revenueOrderIds);

    const productsSold = items.reduce((sum, item) => sum + item.quantity, 0);

    const revenueByProduct = new Map<string, number>();
    for (const item of items) {
      revenueByProduct.set(item.product_name, (revenueByProduct.get(item.product_name) ?? 0) + item.total_cents);
    }
    const topProducts: TopEntry[] = [...revenueByProduct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topLimit)
      .map(([name, cents]) => ({ name, value: cents / 100 }));

    const productIds = [...new Set(items.map((i) => i.product_id).filter((id): id is string => Boolean(id)))];
    const categoryByProduct = await dashboardRepository.getProductCategoryMap(productIds);
    const revenueByCategory = new Map<string, number>();
    for (const item of items) {
      const categoryName = item.product_id ? (categoryByProduct.get(item.product_id) ?? 'Uncategorized') : 'Uncategorized';
      revenueByCategory.set(categoryName, (revenueByCategory.get(categoryName) ?? 0) + item.total_cents);
    }
    const topCategories: TopEntry[] = [...revenueByCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topLimit)
      .map(([name, cents]) => ({ name, value: cents / 100 }));

    const countByStatus = new Map<string, number>();
    for (const order of orders) {
      countByStatus.set(order.status, (countByStatus.get(order.status) ?? 0) + 1);
    }
    const ordersByStatus: TopEntry[] = [...countByStatus.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }));

    return {
      metrics: {
        revenue: { cents: revenueCents, currency },
        ordersCount,
        averageOrderValue: { cents: averageOrderCents, currency },
        newCustomers,
        productsSold,
        lowStockCount: stockCounts.lowStock,
        outOfStockCount: stockCounts.outOfStock,
        pendingOrders,
        pendingPayments,
      },
      revenueSeries,
      ordersSeries,
      topProducts,
      topCategories,
      ordersByStatus,
    };
  }
}

export const dashboardService: DashboardService = new SupabaseDashboardService();
