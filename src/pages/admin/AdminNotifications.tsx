import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminBadge, type AdminBadgeVariant } from '@/components/admin/ui/AdminBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { useToast } from '@/stores/ToastStore';
import { notificationService } from '@/services/notificationService';
import type { Notification, NotificationStatus, NotificationType, Paginated } from '@/types/domain';

const STATUS_VARIANT: Record<NotificationStatus, AdminBadgeVariant> = {
  pending: 'warning',
  sent: 'success',
  failed: 'danger',
};

const TYPE_LABELS: Record<NotificationType, string> = {
  account_verification: 'Account Verification',
  password_reset: 'Password Reset',
  order_confirmation: 'Order Confirmation',
  payment_confirmation: 'Payment Confirmation',
  order_processing: 'Order Processing',
  order_shipped: 'Order Shipped',
  order_delivered: 'Order Delivered',
  refund: 'Refund',
  newsletter: 'Newsletter',
  contact_submission: 'Contact Submission',
};

export function AdminNotifications() {
  const { show } = useToast();
  const [status, setStatus] = useState<NotificationStatus | ''>('');
  const [type, setType] = useState<NotificationType | ''>('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Notification> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const load = () =>
    notificationService.listForAdmin({ status: status || undefined, type: type || undefined, page }).then(setResult);

  useEffect(() => {
    setResult(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, page]);

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    try {
      const count = await notificationService.processQueue();
      show({ title: count > 0 ? `Processed ${count} notification${count === 1 ? '' : 's'}` : 'Nothing to process', variant: 'success' });
      await load();
    } catch (err) {
      show({ title: 'Could not process queue', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Notifications"
        description="Email notification queue — order lifecycle, refunds, and newsletter sign-ups."
        actions={
          <AdminButton onClick={handleProcessQueue} isLoading={isProcessing}>
            <RefreshCw className="h-4 w-4" /> Process queue
          </AdminButton>
        }
      />

      <div className="mb-4 flex gap-3">
        <AdminSelect
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as NotificationStatus | '');
            setPage(1);
          }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'sent', label: 'Sent' },
            { value: 'failed', label: 'Failed' },
          ]}
          className="w-40"
        />
        <AdminSelect
          value={type}
          onChange={(e) => {
            setType(e.target.value as NotificationType | '');
            setPage(1);
          }}
          options={[{ value: '', label: 'All types' }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))]}
          className="w-56"
        />
      </div>

      {result === null ? (
        <AdminTableSkeleton />
      ) : result.items.length === 0 ? (
        <AdminEmptyState title="No notifications" description="Nothing matches this filter right now." />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>Recipient</AdminTh>
                <AdminTh>Type</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Attempts</AdminTh>
                <AdminTh>Created</AdminTh>
                <AdminTh>Detail</AdminTh>
              </tr>
            </AdminTHead>
            <AdminTBody>
              {result.items.map((notification, index) => (
                <AdminTr key={notification.id} index={index}>
                  <AdminTd className="font-mono text-xs">{notification.recipientEmail}</AdminTd>
                  <AdminTd className="text-slate-600">{TYPE_LABELS[notification.type]}</AdminTd>
                  <AdminTd>
                    <AdminBadge variant={STATUS_VARIANT[notification.status]}>{notification.status}</AdminBadge>
                  </AdminTd>
                  <AdminTd className="text-slate-500">
                    {notification.attempts} / {notification.maxAttempts}
                  </AdminTd>
                  <AdminTd className="text-slate-500">{new Date(notification.createdAt).toLocaleString()}</AdminTd>
                  <AdminTd className="max-w-xs truncate text-slate-500">
                    {notification.status === 'failed' ? notification.lastError : notification.subject}
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTBody>
          </AdminTable>
          <AdminPagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
        </AdminTableCard>
      )}
    </div>
  );
}
