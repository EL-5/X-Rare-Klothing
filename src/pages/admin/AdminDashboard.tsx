import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  CreditCard,
  TrendingUp,
  Percent,
  Tag,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { DateRangeFilter, rangeForPreset, type DateRange } from '@/components/admin/dashboard/DateRangeFilter';
import { LineChart } from '@/components/admin/charts/LineChart';
import { BarChart } from '@/components/admin/charts/BarChart';
import { dashboardService, type DashboardData } from '@/services/dashboardService';
import { formatMoney } from '@/utils/money';

export function AdminDashboard() {
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('30d'));
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    dashboardService
      .getDashboardData(range.start, range.end)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Store performance for the selected period."
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      {error ? (
        <AdminErrorState message={error} onRetry={() => setRange({ ...range })} />
      ) : data === null ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <AdminSkeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              index={0}
              label="Revenue"
              value={formatMoney(data.metrics.revenue)}
              icon={DollarSign}
              deltaPercent={data.comparison.revenueChangePercent}
            />
            <StatCard
              index={1}
              label="Orders"
              value={String(data.metrics.ordersCount)}
              icon={ShoppingCart}
              deltaPercent={data.comparison.ordersChangePercent}
            />
            <StatCard
              index={2}
              label="Avg. order value"
              value={formatMoney(data.metrics.averageOrderValue)}
              icon={Receipt}
              deltaPercent={data.comparison.averageOrderValueChangePercent}
            />
            <StatCard
              index={3}
              label="New customers"
              value={String(data.metrics.newCustomers)}
              icon={Users}
              deltaPercent={data.comparison.newCustomersChangePercent}
            />
            <StatCard index={4} label="Products sold" value={String(data.metrics.productsSold)} icon={Package} />
            <StatCard
              index={5}
              label="Low stock"
              value={String(data.metrics.lowStockCount)}
              icon={AlertTriangle}
              tone={data.metrics.lowStockCount > 0 ? 'warning' : 'default'}
            />
            <StatCard
              index={6}
              label="Out of stock"
              value={String(data.metrics.outOfStockCount)}
              icon={XCircle}
              tone={data.metrics.outOfStockCount > 0 ? 'danger' : 'default'}
            />
            <StatCard
              index={7}
              label="Pending orders"
              value={String(data.metrics.pendingOrders)}
              icon={Clock}
              tone={data.metrics.pendingOrders > 0 ? 'warning' : 'default'}
            />
            <StatCard
              index={8}
              label="Pending payments"
              value={String(data.metrics.pendingPayments)}
              icon={CreditCard}
              tone={data.metrics.pendingPayments > 0 ? 'warning' : 'default'}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard index={9} label="Gross profit" value={formatMoney(data.financials.grossProfit)} icon={TrendingUp} />
            <StatCard
              index={10}
              label="Gross margin"
              value={data.financials.grossMarginPercent === null ? '—' : `${data.financials.grossMarginPercent.toFixed(1)}%`}
              icon={Percent}
            />
            <StatCard index={11} label="Discounts given" value={formatMoney(data.financials.discountsGiven)} icon={Tag} />
          </div>
          {data.financials.itemsWithoutCostCount > 0 ? (
            <p className="mt-2 text-xs text-slate-400">
              Gross profit is estimated from each item's currently-recorded cost — {data.financials.itemsWithoutCostCount} line item
              {data.financials.itemsWithoutCostCount === 1 ? '' : 's'} with no recorded cost {data.financials.itemsWithoutCostCount === 1 ? 'is' : 'are'} excluded.
            </p>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-6 grid gap-4 lg:grid-cols-2"
          >
            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Revenue</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <LineChart data={data.revenueSeries} formatValue={(v) => `$${v.toFixed(0)}`} />
              </AdminCardBody>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Orders</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <LineChart data={data.ordersSeries} color="#0EA5E9" />
              </AdminCardBody>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Top products</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.topProducts} formatValue={(v) => `$${v.toFixed(0)}`} />
              </AdminCardBody>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Top categories</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.topCategories} formatValue={(v) => `$${v.toFixed(0)}`} color="#0EA5E9" />
              </AdminCardBody>
            </AdminCard>

            <AdminCard className="lg:col-span-2">
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Revenue by payment method</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.revenueByProvider} formatValue={(v) => `$${v.toFixed(0)}`} color="#16A34A" />
              </AdminCardBody>
            </AdminCard>
          </motion.div>

          <p className="mt-4 text-xs text-slate-400">
            Revenue counts orders with status paid, processing, ready for shipping, shipped, or delivered — not pending/cancelled/refunded.
          </p>
        </>
      )}
    </div>
  );
}
