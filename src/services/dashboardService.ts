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

export interface FinancialSummary {
  /** Subtotal minus discounts across revenue-recognized orders — product revenue, excluding shipping/tax. */
  grossMerchandiseRevenue: Money;
  discountsGiven: Money;
  taxCollected: Money;
  shippingRevenue: Money;
  /** Approximate: order_items doesn't snapshot cost at time of sale, so this uses each variant's currently-recorded cost. */
  estimatedCogs: Money;
  grossProfit: Money;
  grossMarginPercent: number | null;
  /** Line items excluded from the COGS estimate because their variant was deleted or has no recorded cost — shown so the estimate isn't presented as more complete than it is. */
  itemsWithoutCostCount: number;
}

export interface PeriodComparison {
  revenueChangePercent: number | null;
  ordersChangePercent: number | null;
  averageOrderValueChangePercent: number | null;
  newCustomersChangePercent: number | null;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  revenueSeries: ChartPoint[];
  ordersSeries: ChartPoint[];
  topProducts: TopEntry[];
  topCategories: TopEntry[];
  ordersByStatus: TopEntry[];
  funnel: TopEntry[];
  customerGrowthSeries: ChartPoint[];
  financials: FinancialSummary;
  revenueByProvider: TopEntry[];
  comparison: PeriodComparison;
}

/** Order statuses counted as recognized revenue — excludes not-yet-paid and cancelled/refunded orders. */
const REVENUE_STATUSES = new Set(['paid', 'processing', 'ready_for_shipping', 'shipped', 'delivered']);

/**
 * Funnel stage order matches the tracking calls wired into the storefront
 * (see analyticsService): each stage counts *distinct sessions* that fired
 * that event in range, not raw event counts, so a session bouncing between
 * products doesn't inflate "Product view" relative to "Page view".
 */
const FUNNEL_STAGES: { type: string; label: string }[] = [
  { type: 'page_view', label: 'Page view' },
  { type: 'product_view', label: 'Product view' },
  { type: 'add_to_cart', label: 'Add to cart' },
  { type: 'checkout_started', label: 'Checkout started' },
  { type: 'payment_started', label: 'Payment started' },
  { type: 'purchase', label: 'Purchase' },
];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Null when the previous period had nothing to compare against (0 → N is not a meaningful percentage). */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface DashboardService {
  getDashboardData(startDate: Date, endDate: Date, currency?: string, topLimit?: number): Promise<DashboardData>;
}

class SupabaseDashboardService implements DashboardService {
  async getDashboardData(startDate: Date, endDate: Date, currency = 'USD', topLimit = 5): Promise<DashboardData> {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // Same-length window immediately preceding the selected range — the baseline for the comparison deltas shown on each stat card.
    const rangeMs = endDate.getTime() - startDate.getTime();
    const previousEnd = new Date(startDate.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - rangeMs);
    const previousStartISO = previousStart.toISOString();
    const previousEndISO = previousEnd.toISOString();

    const [orders, newCustomers, pendingOrders, pendingPayments, stockCounts, funnelEvents, newCustomerRows, previousOrders, previousNewCustomers] =
      await Promise.all([
        dashboardRepository.getOrdersInRange(startISO, endISO),
        dashboardRepository.countNewCustomersInRange(startISO, endISO),
        dashboardRepository.countPendingOrders(),
        dashboardRepository.countPendingPayments(),
        dashboardRepository.getStockCounts(),
        dashboardRepository.getFunnelEventsInRange(startISO, endISO),
        dashboardRepository.getNewCustomersCreatedAtInRange(startISO, endISO),
        dashboardRepository.getOrdersInRange(previousStartISO, previousEndISO),
        dashboardRepository.countNewCustomersInRange(previousStartISO, previousEndISO),
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

    // Financial depth: merchandise revenue after discounts, tax/shipping collected,
    // an estimated COGS/margin from each variant's currently-recorded cost (staff-only,
    // masked to null for anyone else by the RPC itself), and revenue by payment provider.
    const grossMerchandiseCents = revenueOrders.reduce((sum, o) => sum + (o.subtotal_cents - o.discount_cents), 0);
    const discountsCents = revenueOrders.reduce((sum, o) => sum + o.discount_cents, 0);
    const taxCents = revenueOrders.reduce((sum, o) => sum + o.tax_cents, 0);
    const shippingCents = revenueOrders.reduce((sum, o) => sum + o.shipping_cents, 0);

    const variantIds = [...new Set(items.map((i) => i.variant_id).filter((id): id is string => Boolean(id)))];
    const costByVariant = await dashboardRepository.getVariantCosts(variantIds);
    let cogsCents = 0;
    let itemsWithoutCostCount = 0;
    for (const item of items) {
      const cost = item.variant_id ? costByVariant.get(item.variant_id) : null;
      if (cost === null || cost === undefined) {
        itemsWithoutCostCount += 1;
        continue;
      }
      cogsCents += cost * item.quantity;
    }
    const grossProfitCents = grossMerchandiseCents - cogsCents;

    const payments = await dashboardRepository.getPaymentsForOrders(revenueOrderIds);
    const revenueByProviderCents = new Map<string, number>();
    for (const payment of payments) {
      if (payment.status !== 'paid') continue;
      revenueByProviderCents.set(payment.provider, (revenueByProviderCents.get(payment.provider) ?? 0) + payment.amount_cents);
    }
    const revenueByProvider: TopEntry[] = [...revenueByProviderCents.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, cents]) => ({ name, value: cents / 100 }));

    const financials: FinancialSummary = {
      grossMerchandiseRevenue: { cents: grossMerchandiseCents, currency },
      discountsGiven: { cents: discountsCents, currency },
      taxCollected: { cents: taxCents, currency },
      shippingRevenue: { cents: shippingCents, currency },
      estimatedCogs: { cents: cogsCents, currency },
      grossProfit: { cents: grossProfitCents, currency },
      grossMarginPercent: grossMerchandiseCents > 0 ? (grossProfitCents / grossMerchandiseCents) * 100 : null,
      itemsWithoutCostCount,
    };

    // Period-over-period comparison — previous window's headline numbers only, not the full breakdown.
    const previousRevenueOrders = previousOrders.filter((o) => REVENUE_STATUSES.has(o.status));
    const previousRevenueCents = previousRevenueOrders.reduce((sum, o) => sum + o.total_cents, 0);
    const previousAverageOrderCents = previousRevenueOrders.length > 0 ? Math.round(previousRevenueCents / previousRevenueOrders.length) : 0;
    const comparison: PeriodComparison = {
      revenueChangePercent: percentChange(revenueCents, previousRevenueCents),
      ordersChangePercent: percentChange(ordersCount, previousOrders.length),
      averageOrderValueChangePercent: percentChange(averageOrderCents, previousAverageOrderCents),
      newCustomersChangePercent: percentChange(newCustomers, previousNewCustomers),
    };

    const countByStatus = new Map<string, number>();
    for (const order of orders) {
      countByStatus.set(order.status, (countByStatus.get(order.status) ?? 0) + 1);
    }
    const ordersByStatus: TopEntry[] = [...countByStatus.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }));

    const sessionsByType = new Map<string, Set<string>>();
    for (const event of funnelEvents) {
      const set = sessionsByType.get(event.type) ?? new Set<string>();
      set.add(event.session_id);
      sessionsByType.set(event.type, set);
    }
    const funnel: TopEntry[] = FUNNEL_STAGES.map((stage) => ({
      name: stage.label,
      value: sessionsByType.get(stage.type)?.size ?? 0,
    }));

    const customersByDay = new Map<string, number>();
    for (const row of newCustomerRows) {
      const key = dayKey(row.created_at);
      customersByDay.set(key, (customersByDay.get(key) ?? 0) + 1);
    }
    const customerGrowthSeries: ChartPoint[] = days.map((d) => ({ label: d, value: customersByDay.get(d) ?? 0 }));

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
      funnel,
      customerGrowthSeries,
      financials,
      revenueByProvider,
      comparison,
    };
  }
}

export const dashboardService: DashboardService = new SupabaseDashboardService();
