import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService } from '@/services/orderService';
import { formatMoney } from '@/utils/money';
import { ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import type { Order, OrderStatus, PaymentStatus } from '@/types/domain';

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  successful: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partially refunded',
};

const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  pending: 'neutral',
  processing: 'neutral',
  successful: 'success',
  failed: 'sold-out',
  refunded: 'neutral',
  partially_refunded: 'neutral',
};

const SHIPPING_STATUS: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Awaiting payment', variant: 'neutral' },
  payment_pending: { label: 'Awaiting payment', variant: 'neutral' },
  paid: { label: 'Preparing your order', variant: 'neutral' },
  processing: { label: 'Preparing your order', variant: 'neutral' },
  ready_for_shipping: { label: 'Ready for shipping', variant: 'neutral' },
  shipped: { label: 'Shipped', variant: 'success' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'sold-out' },
  refunded: { label: 'Refunded', variant: 'sold-out' },
  partially_refunded: { label: 'Partially refunded', variant: 'neutral' },
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    // RLS scopes this to the signed-in customer's own orders — if the id
    // belongs to someone else, Postgres returns no row (not an error), so
    // this naturally resolves to "not found" rather than leaking the order.
    orderService.getById(id).then(setOrder);
  }, [id]);

  if (order === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (order === null) {
    return (
      <div>
        <h1 className="text-xl font-semibold uppercase tracking-wide text-ink">Order not found</h1>
        <Link to={ROUTES.accountOrders} className="mt-4 inline-block text-sm underline-offset-2 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const latestPayment = order.payments[0] ?? null;
  const shipping = SHIPPING_STATUS[order.status];
  const shippingAddress = order.addresses.find((address) => address.type === 'shipping') ?? null;

  return (
    <div>
      <Link to={ROUTES.accountOrders} className="text-sm text-ink/60 hover:text-ink">
        ← Back to orders
      </Link>
      <h1 className="mt-2 text-xl font-semibold uppercase tracking-wide text-ink">{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-ink/60">Placed {new Date(order.placedAt).toLocaleDateString()}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Payment status</p>
          <div className="mt-2">
            {latestPayment ? (
              <Badge variant={PAYMENT_STATUS_VARIANT[latestPayment.status]}>{PAYMENT_STATUS_LABEL[latestPayment.status]}</Badge>
            ) : (
              <Badge variant="neutral">Pending</Badge>
            )}
          </div>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Shipping status</p>
          <div className="mt-2">
            <Badge variant={shipping.variant}>{shipping.label}</Badge>
          </div>
          {shippingAddress ? (
            <p className="mt-3 text-xs leading-relaxed text-ink/70">
              {shippingAddress.firstName} {shippingAddress.lastName}
              <br />
              {shippingAddress.line1}
              {shippingAddress.line2 ? <>, {shippingAddress.line2}</> : null}
              <br />
              {shippingAddress.city}
              {shippingAddress.region ? `, ${shippingAddress.region}` : ''} {shippingAddress.postalCode ?? ''}
              <br />
              {shippingAddress.country}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-6 flex flex-col divide-y divide-border border-y border-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <div className="h-16 w-12 shrink-0 bg-surface-muted" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{item.productName}</p>
              {item.variantTitle ? <p className="text-xs text-ink/60">{item.variantTitle}</p> : null}
              <p className="text-xs text-ink/60">Qty {item.quantity}</p>
            </div>
            <p className="text-sm font-medium text-ink">{formatMoney(item.total)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex max-w-xs flex-col gap-2 self-end text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60">Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Discount</span>
          <span>-{formatMoney(order.discount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Shipping</span>
          <span>{formatMoney(order.shipping)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Tax</span>
          <span>{formatMoney(order.tax)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold text-ink">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
