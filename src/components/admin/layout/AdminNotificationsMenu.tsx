import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { dashboardRepository } from '@/repositories/dashboardRepository';
import { useDisclosure } from '@/hooks/useDisclosure';

interface AlertItem {
  label: string;
  count: number;
  href: string;
}

/**
 * Real operational signals (low/out-of-stock counts, pending orders) rather
 * than a `notifications` table — Batch 2's schema deliberately doesn't
 * include one (see docs/database.md), so this surfaces the same kind of
 * information from data that actually exists.
 */
export function AdminNotificationsMenu() {
  const { isOpen, toggle, close } = useDisclosure();
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);

  useEffect(() => {
    Promise.all([
      dashboardRepository.getStockCounts(),
      dashboardRepository.countPendingOrders(),
      dashboardRepository.countPendingPayments(),
    ]).then(([stock, pendingOrders, pendingPayments]) => {
      setAlerts([
        { label: 'Out of stock', count: stock.outOfStock, href: '/admin/inventory' },
        { label: 'Low stock', count: stock.lowStock, href: '/admin/inventory' },
        { label: 'Pending orders', count: pendingOrders, href: '/admin/orders' },
        { label: 'Pending payments', count: pendingPayments, href: '/admin/orders' },
      ]);
    });
  }, []);

  const total = alerts?.reduce((sum, a) => sum + a.count, 0) ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {total > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
        ) : null}
      </button>

      {isOpen ? (
        <>
          <button type="button" aria-label="Close menu" onClick={close} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Attention needed</p>
            {alerts === null ? (
              <p className="px-3 py-3 text-sm text-slate-500">Loading…</p>
            ) : alerts.every((a) => a.count === 0) ? (
              <p className="px-3 py-3 text-sm text-slate-500">All clear — nothing needs attention.</p>
            ) : (
              alerts
                .filter((a) => a.count > 0)
                .map((alert) => (
                  <Link
                    key={alert.label}
                    to={alert.href}
                    onClick={close}
                    className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {alert.label}
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      {alert.count}
                    </span>
                  </Link>
                ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
