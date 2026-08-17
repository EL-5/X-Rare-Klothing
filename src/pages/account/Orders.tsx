import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/stores/AuthStore';
import { orderService } from '@/services/orderService';
import { formatMoney } from '@/utils/money';
import { ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/Skeleton';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import type { Order } from '@/types/domain';

export function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!profile) return;
    orderService.listForCustomer(profile.id).then(setOrders);
  }, [profile]);

  return (
    <div>
      <AccountPageHeader title="Orders" description="Track and review past purchases." />

      {orders === null ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60">You haven't placed any orders yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-border border-y border-border">
          {orders.map((order, index) => (
            <motion.li
              key={order.id}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : Math.min(index, 20) * 0.04 }}
            >
              <Link
                to={ROUTES.accountOrder(order.id)}
                className="flex items-center justify-between py-4 text-sm transition-colors duration-150 hover:bg-surface-muted"
              >
                <div>
                  <p className="font-medium text-ink">{order.orderNumber}</p>
                  <p className="mt-1 text-ink/60">{new Date(order.placedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink">{formatMoney(order.total)}</p>
                  <p className="mt-1 capitalize text-ink/60">{order.status.replace('_', ' ')}</p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
