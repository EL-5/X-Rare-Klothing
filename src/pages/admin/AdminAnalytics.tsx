import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Tag, Receipt, Truck, PackageMinus, TrendingUp, Percent } from 'lucide-react';
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

export function AdminAnalytics() {
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('90d'));
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    dashboardService
      .getDashboardData(range.start, range.end, 'USD', 10)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics.');
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Deeper breakdowns than the dashboard summary."
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      {error ? (
        <AdminErrorState message={error} onRetry={() => setRange({ ...range })} />
      ) : data === null ? (
        <AdminSkeleton className="h-96 w-full" />
      ) : (
        <div className="flex flex-col gap-6">
          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Financial breakdown</h2>
              <p className="text-xs text-slate-500">Merchandise revenue, discounts, tax, shipping, and estimated margin for the selected period.</p>
            </AdminCardHeader>
            <AdminCardBody>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard index={0} label="Merchandise revenue" value={formatMoney(data.financials.grossMerchandiseRevenue)} icon={DollarSign} />
                <StatCard index={1} label="Discounts given" value={formatMoney(data.financials.discountsGiven)} icon={Tag} />
                <StatCard index={2} label="Tax collected" value={formatMoney(data.financials.taxCollected)} icon={Receipt} />
                <StatCard index={3} label="Shipping revenue" value={formatMoney(data.financials.shippingRevenue)} icon={Truck} />
                <StatCard index={4} label="Estimated COGS" value={formatMoney(data.financials.estimatedCogs)} icon={PackageMinus} />
                <StatCard index={5} label="Gross profit" value={formatMoney(data.financials.grossProfit)} icon={TrendingUp} />
                <StatCard
                  index={6}
                  label="Gross margin"
                  value={data.financials.grossMarginPercent === null ? '—' : `${data.financials.grossMarginPercent.toFixed(1)}%`}
                  icon={Percent}
                />
              </div>
              {data.financials.itemsWithoutCostCount > 0 ? (
                <p className="mt-3 text-xs text-slate-400">
                  COGS/margin are estimated from each item's currently-recorded cost, not a snapshot from the time of sale —{' '}
                  {data.financials.itemsWithoutCostCount} line item{data.financials.itemsWithoutCostCount === 1 ? '' : 's'} with no recorded cost{' '}
                  {data.financials.itemsWithoutCostCount === 1 ? 'is' : 'are'} excluded from the estimate.
                </p>
              ) : null}
            </AdminCardBody>
          </AdminCard>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Revenue trend</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <LineChart data={data.revenueSeries} formatValue={(v) => `$${v.toFixed(0)}`} />
              </AdminCardBody>
            </AdminCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid gap-6 lg:grid-cols-2">
            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Conversion funnel</h2>
                <p className="text-xs text-slate-500">Distinct sessions reaching each stage in range.</p>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.funnel} color="#7C3AED" />
              </AdminCardBody>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Customer growth</h2>
                <p className="text-xs text-slate-500">New accounts created per day.</p>
              </AdminCardHeader>
              <AdminCardBody>
                <LineChart data={data.customerGrowthSeries} />
              </AdminCardBody>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Top 10 products by revenue</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.topProducts} formatValue={(v) => `$${v.toFixed(0)}`} />
              </AdminCardBody>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Top 10 categories by revenue</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.topCategories} formatValue={(v) => `$${v.toFixed(0)}`} color="#0EA5E9" />
              </AdminCardBody>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Revenue by payment method</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.revenueByProvider} formatValue={(v) => `$${v.toFixed(0)}`} color="#16A34A" />
              </AdminCardBody>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Orders by status</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.ordersByStatus} color="#16A34A" />
              </AdminCardBody>
            </AdminCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
