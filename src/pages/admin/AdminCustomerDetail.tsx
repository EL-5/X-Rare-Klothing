import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { customerService } from '@/services/customerService';
import { addressService } from '@/services/addressService';
import { orderService } from '@/services/orderService';
import { formatMoney } from '@/utils/money';
import type { Address, Customer, Order } from '@/types/domain';

export function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([customerService.getById(id), addressService.listForCustomer(id), orderService.listForCustomer(id)]).then(
      ([c, a, o]) => {
        setCustomer(c);
        setAddresses(a);
        setOrders(o);
      },
    );
  }, [id]);

  if (customer === undefined) {
    return <AdminSkeleton className="h-96 w-full" />;
  }

  if (customer === null) {
    return (
      <div>
        <AdminPageHeader title="Customer not found" />
        <AdminButton variant="outline" onClick={() => navigate('/admin/customers')}>
          Back to customers
        </AdminButton>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={[customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email} description={customer.email} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Orders</h2>
            </AdminCardHeader>
            <AdminCardBody className="p-0">
              {orders === null ? (
                <div className="p-5">
                  <AdminSkeleton className="h-24 w-full" />
                </div>
              ) : orders.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <li key={order.id}>
                      <Link to={`/admin/orders/${order.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50">
                        <div>
                          <p className="font-medium text-slate-900">{order.orderNumber}</p>
                          <p className="text-slate-500">{new Date(order.placedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">{formatMoney(order.total)}</p>
                          <AdminBadge className="mt-1">{order.status.replace('_', ' ')}</AdminBadge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCardBody>
          </AdminCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-1 text-sm text-slate-700">
              <p>{customer.email}</p>
              <p>{customer.phone ?? 'No phone on file'}</p>
              <p className="text-xs text-slate-400">{customer.acceptsMarketing ? 'Subscribed to marketing emails' : 'Not subscribed to marketing emails'}</p>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Addresses</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-4 text-sm">
              {addresses === null ? (
                <AdminSkeleton className="h-16 w-full" />
              ) : addresses.length === 0 ? (
                <p className="text-slate-500">No saved addresses.</p>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-slate-900">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-slate-600">{address.line1}</p>
                    <p className="text-slate-600">
                      {address.city}
                      {address.region ? `, ${address.region}` : ''} {address.postalCode}
                    </p>
                    <p className="text-slate-600">{address.country}</p>
                  </div>
                ))
              )}
            </AdminCardBody>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
