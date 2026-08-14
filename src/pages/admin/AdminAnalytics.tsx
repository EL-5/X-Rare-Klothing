import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { DateRangeFilter, rangeForPreset, type DateRange } from '@/components/admin/dashboard/DateRangeFilter';
import { LineChart } from '@/components/admin/charts/LineChart';
import { BarChart } from '@/components/admin/charts/BarChart';
import { dashboardService, type DashboardData } from '@/services/dashboardService';

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
              <h2 className="text-sm font-semibold text-slate-900">Revenue trend</h2>
            </AdminCardHeader>
            <AdminCardBody>
              <LineChart data={data.revenueSeries} formatValue={(v) => `$${v.toFixed(0)}`} />
            </AdminCardBody>
          </AdminCard>

          <div className="grid gap-6 lg:grid-cols-2">
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

            <AdminCard className="lg:col-span-2">
              <AdminCardHeader>
                <h2 className="text-sm font-semibold text-slate-900">Orders by status</h2>
              </AdminCardHeader>
              <AdminCardBody>
                <BarChart data={data.ordersByStatus} color="#16A34A" />
              </AdminCardBody>
            </AdminCard>
          </div>
        </div>
      )}
    </div>
  );
}
