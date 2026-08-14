import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminSelect, AdminInput, AdminTextarea } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminBadge, type AdminBadgeVariant } from '@/components/admin/ui/AdminBadge';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { orderService } from '@/services/orderService';
import { useToast } from '@/stores/ToastStore';
import { formatMoney } from '@/utils/money';
import type { Order, OrderStatus, PaymentStatus } from '@/types/domain';

const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, AdminBadgeVariant> = {
  pending: 'neutral',
  processing: 'info',
  successful: 'success',
  failed: 'danger',
  refunded: 'danger',
  partially_refunded: 'warning',
};

const NON_CANCELLABLE: OrderStatus[] = ['shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded'];
const REFUNDABLE: OrderStatus[] = ['paid', 'processing', 'ready_for_shipping', 'shipped', 'delivered', 'partially_refunded'];

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
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
];

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

export function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [refundAmount, setRefundAmount] = useState('');
  const [refundRestock, setRefundRestock] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const load = () => {
    if (!id) return;
    orderService.getById(id).then((o) => {
      setOrder(o);
      if (o) {
        setNotes(o.internalNotes ?? '');
        setRefundAmount((o.total.cents / 100).toFixed(2));
      }
    });
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirmStatusChange = async () => {
    if (!id || !pendingStatus) return;
    setIsUpdating(true);
    try {
      const updated = await orderService.updateStatus(id, pendingStatus);
      setOrder(updated);
      show({ title: 'Order status updated', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not update status', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsUpdating(false);
      setPendingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    setIsSavingNotes(true);
    try {
      const updated = await orderService.updateInternalNotes(id, notes);
      setOrder(updated);
      show({ title: 'Notes saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save notes', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!id) return;
    setIsCancelling(true);
    try {
      const updated = await orderService.cancel(id, cancelReason || undefined);
      setOrder(updated);
      setNotes(updated.internalNotes ?? '');
      show({ title: 'Order cancelled', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not cancel order', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
      setCancelReason('');
    }
  };

  const handleConfirmRefund = async () => {
    if (!id) return;
    const amountCents = Math.round(Number(refundAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      show({ title: 'Enter a valid refund amount', variant: 'error' });
      setShowRefundConfirm(false);
      return;
    }
    setIsRefunding(true);
    try {
      const updated = await orderService.refund(id, amountCents, refundRestock, refundReason || undefined);
      setOrder(updated);
      setNotes(updated.internalNotes ?? '');
      show({ title: 'Refund processed', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not process refund', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsRefunding(false);
      setShowRefundConfirm(false);
      setRefundReason('');
    }
  };

  if (order === undefined) {
    return <AdminSkeleton className="h-96 w-full" />;
  }

  if (order === null) {
    return (
      <div>
        <AdminPageHeader title="Order not found" />
        <AdminButton variant="outline" onClick={() => navigate('/admin/orders')}>
          Back to orders
        </AdminButton>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={order.orderNumber}
        description={`Placed ${new Date(order.placedAt).toLocaleString()}`}
        actions={<AdminBadge variant={STATUS_VARIANT[order.status]}>{order.status.replace('_', ' ')}</AdminBadge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Items</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col divide-y divide-slate-100 p-0">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="h-14 w-11 shrink-0 rounded bg-slate-100" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.productName}</p>
                    {item.variantTitle ? <p className="text-xs text-slate-500">{item.variantTitle}</p> : null}
                    <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{formatMoney(item.total)}</p>
                </div>
              ))}
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Discount</span>
                <span>-{formatMoney(order.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span>{formatMoney(order.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span>{formatMoney(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Payment</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col divide-y divide-slate-100 p-0">
              {order.payments.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-500">No payment attempts yet.</p>
              ) : (
                order.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div>
                      <p className="text-sm font-medium capitalize text-slate-900">{payment.provider}</p>
                      <p className="text-xs text-slate-500">{new Date(payment.createdAt).toLocaleString()}</p>
                      {payment.providerReference ? (
                        <p className="text-xs text-slate-400">Ref: {payment.providerReference}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900">{formatMoney(payment.amount)}</span>
                      <AdminBadge variant={PAYMENT_STATUS_VARIANT[payment.status]}>{payment.status.replace('_', ' ')}</AdminBadge>
                    </div>
                  </div>
                ))
              )}
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Shipping</h2>
            </AdminCardHeader>
            <AdminCardBody>
              {(() => {
                const shippingAddress = order.addresses.find((a) => a.type === 'shipping');
                if (!shippingAddress) return <p className="text-sm text-slate-500">No shipping address on file.</p>;
                return (
                  <p className="text-sm leading-relaxed text-slate-700">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                    <br />
                    {shippingAddress.line1}
                    {shippingAddress.line2 ? <>, {shippingAddress.line2}</> : null}
                    <br />
                    {shippingAddress.city}
                    {shippingAddress.region ? `, ${shippingAddress.region}` : ''} {shippingAddress.postalCode ?? ''}
                    <br />
                    {shippingAddress.country}
                    {shippingAddress.phone ? <><br />{shippingAddress.phone}</> : null}
                  </p>
                );
              })()}
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Internal notes</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-3">
              <AdminTextarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visible to staff only — never shown to the customer."
              />
              <AdminButton
                variant="outline"
                size="sm"
                className="self-start"
                isLoading={isSavingNotes}
                disabled={notes === (order.internalNotes ?? '')}
                onClick={handleSaveNotes}
              >
                Save notes
              </AdminButton>
            </AdminCardBody>
          </AdminCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard className="h-fit">
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Customer</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-slate-700">{order.email}</p>
                {order.customerId ? (
                  <Link to={`/admin/customers/${order.customerId}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    View customer profile →
                  </Link>
                ) : (
                  <p className="text-xs text-slate-400">Guest checkout — no account</p>
                )}
              </div>

              <AdminSelect
                label="Update status"
                value={order.status}
                onChange={(e) => setPendingStatus(e.target.value as OrderStatus)}
                options={STATUS_OPTIONS}
              />
            </AdminCardBody>
          </AdminCard>

          <AdminCard className="h-fit">
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Actions</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cancel order</p>
                <AdminTextarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason (optional)"
                  rows={2}
                  disabled={NON_CANCELLABLE.includes(order.status)}
                />
                <AdminButton
                  variant="danger"
                  size="sm"
                  className="self-start"
                  disabled={NON_CANCELLABLE.includes(order.status)}
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel order
                </AdminButton>
                {NON_CANCELLABLE.includes(order.status) ? (
                  <p className="text-xs text-slate-400">
                    {order.status === 'shipped' || order.status === 'delivered'
                      ? 'Already shipped — use a refund instead.'
                      : 'This order cannot be cancelled from its current status.'}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Process refund</p>
                <AdminInput
                  label="Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  disabled={!REFUNDABLE.includes(order.status)}
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={refundRestock}
                    onChange={(e) => setRefundRestock(e.target.checked)}
                    disabled={!REFUNDABLE.includes(order.status)}
                  />
                  Restock returned items
                </label>
                <AdminTextarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason (optional)"
                  rows={2}
                  disabled={!REFUNDABLE.includes(order.status)}
                />
                <AdminButton
                  variant="danger"
                  size="sm"
                  className="self-start"
                  disabled={!REFUNDABLE.includes(order.status)}
                  onClick={() => setShowRefundConfirm(true)}
                >
                  Process refund
                </AdminButton>
                {!REFUNDABLE.includes(order.status) ? (
                  <p className="text-xs text-slate-400">This order isn't in a refundable state.</p>
                ) : null}
              </div>
            </AdminCardBody>
          </AdminCard>
        </div>
      </div>

      <AdminConfirmDialog
        isOpen={pendingStatus !== null}
        title="Change order status?"
        description={pendingStatus ? `This will mark the order as "${pendingStatus.replace('_', ' ')}".` : undefined}
        confirmLabel="Update status"
        confirmVariant="primary"
        isConfirming={isUpdating}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setPendingStatus(null)}
      />

      <AdminConfirmDialog
        isOpen={showCancelConfirm}
        title="Cancel this order?"
        description="Any inventory reserved or sold for this order will be restored where appropriate. This cannot be undone."
        confirmLabel="Cancel order"
        confirmVariant="danger"
        isConfirming={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <AdminConfirmDialog
        isOpen={showRefundConfirm}
        title="Process this refund?"
        description={`This will refund ${refundAmount || '0'} ${order.total.currency}${refundRestock ? ' and restock the returned items' : ''}.`}
        confirmLabel="Process refund"
        confirmVariant="danger"
        isConfirming={isRefunding}
        onConfirm={handleConfirmRefund}
        onCancel={() => setShowRefundConfirm(false)}
      />
    </div>
  );
}
