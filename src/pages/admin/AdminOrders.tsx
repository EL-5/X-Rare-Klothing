import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchInput } from '@/components/admin/ui/AdminSearchInput';
import { AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminBadge, type AdminBadgeVariant } from '@/components/admin/ui/AdminBadge';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { orderService } from '@/services/orderService';
import { formatMoney } from '@/utils/money';
import type { Order, OrderStatus } from '@/types/domain';

const STATUS_VARIANT: Record<OrderStatus, AdminBadgeVariant> = {
  pending: 'neutral',
  payment_pending: 'warning',
  paid: 'info',
  processing: 'info',
  ready_for_shipping: 'success',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'danger',
  partially_refunded: 'warning',
};

const PAGE_SIZE = 20;

export function AdminOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    let cancelled = false;
    setOrders(null);
    setError(null);
    orderService
      .listForAdmin({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined, status: status || undefined })
      .then((result) => {
        if (cancelled) return;
        setOrders(result.items);
        setTotal(result.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load orders.');
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status]);

  return (
    <div>
      <AdminPageHeader title="Orders" description="Every order in the store." />

      <div className="mb-4 flex flex-wrap gap-3">
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by order number or email…" className="w-80" />
        <AdminSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'payment_pending', label: 'Payment pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'processing', label: 'Processing' },
            { value: 'ready_for_shipping', label: 'Ready for shipping' },
            { value: 'shipped', label: 'Shipped' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'partially_refunded', label: 'Partially refunded' },
          ]}
          className="w-48"
        />
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={() => setPage((p) => p)} />
      ) : orders === null ? (
        <AdminTableSkeleton />
      ) : orders.length === 0 ? (
        <AdminEmptyState title="No orders found" description={debouncedSearch || status ? 'Try a different search or filter.' : 'Orders will show up here once customers start checking out.'} />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>Order</AdminTh>
                <AdminTh>Customer</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Placed</AdminTh>
                <AdminTh>Total</AdminTh>
              </tr>
            </AdminTHead>
            <AdminTBody>
              {orders.map((order, index) => (
                <AdminTr key={order.id} index={index} className="cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                  <AdminTd>
                    <Link to={`/admin/orders/${order.id}`} className="font-medium text-slate-900 hover:text-indigo-600" onClick={(e) => e.stopPropagation()}>
                      {order.orderNumber}
                    </Link>
                  </AdminTd>
                  <AdminTd className="text-slate-500">{order.email}</AdminTd>
                  <AdminTd>
                    <AdminBadge variant={STATUS_VARIANT[order.status]}>{order.status.replace('_', ' ')}</AdminBadge>
                  </AdminTd>
                  <AdminTd className="text-slate-500">{new Date(order.placedAt).toLocaleDateString()}</AdminTd>
                  <AdminTd className="font-medium text-slate-900">{formatMoney(order.total)}</AdminTd>
                </AdminTr>
              ))}
            </AdminTBody>
          </AdminTable>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </AdminTableCard>
      )}
    </div>
  );
}
