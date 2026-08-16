import { useEffect, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminBadge, type AdminBadgeVariant } from '@/components/admin/ui/AdminBadge';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { useToast } from '@/stores/ToastStore';
import { contactService } from '@/services/contactService';
import type { ContactSubmission, ContactStatus, ContactSubject } from '@/types/domain';

const STATUS_VARIANT: Record<ContactStatus, AdminBadgeVariant> = {
  new: 'warning',
  in_progress: 'neutral',
  resolved: 'success',
};

const SUBJECT_LABEL: Record<ContactSubject, string> = {
  general_question: 'General Question',
  order_support: 'Order Support',
  product_question: 'Product Question',
  returns_exchanges: 'Returns & Exchanges',
  wholesale: 'Wholesale',
  collaboration: 'Collaboration',
  press: 'Press',
  other: 'Other',
};

export function AdminContactSubmissions() {
  const { show } = useToast();
  const [status, setStatus] = useState<ContactStatus | ''>('new');
  const [submissions, setSubmissions] = useState<ContactSubmission[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = () => contactService.listForAdmin(status || undefined).then(setSubmissions);

  useEffect(() => {
    setSubmissions(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleStatusChange = async (id: string, next: ContactStatus) => {
    setPendingId(id);
    try {
      await contactService.updateStatus(id, next);
      await load();
      show({ title: `Marked as ${next.replace('_', ' ')}`, variant: 'success' });
    } catch (err) {
      show({ title: 'Could not update submission', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Contact Submissions" description="Messages sent through the storefront's Contact page." />

      <div className="mb-4">
        <AdminSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as ContactStatus | '')}
          options={[
            { value: 'new', label: 'New' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: '', label: 'All' },
          ]}
          className="w-40"
        />
      </div>

      {submissions === null ? (
        <AdminTableSkeleton />
      ) : submissions.length === 0 ? (
        <AdminEmptyState title="No messages here" description="Nothing matches this filter right now." />
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((submission, index) => (
            <AdminCard key={submission.id} index={index}>
              <AdminCardBody>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {submission.firstName} {submission.lastName}
                      </p>
                      <AdminBadge variant={STATUS_VARIANT[submission.status]}>{submission.status.replace('_', ' ')}</AdminBadge>
                      <AdminBadge variant="neutral">{SUBJECT_LABEL[submission.subject]}</AdminBadge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {submission.email}
                      {submission.phone ? ` · ${submission.phone}` : ''}
                      {submission.orderNumber ? ` · Order ${submission.orderNumber}` : ''}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{submission.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{new Date(submission.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {submission.status !== 'in_progress' ? (
                      <AdminButton
                        size="sm"
                        variant="outline"
                        disabled={pendingId === submission.id}
                        onClick={() => handleStatusChange(submission.id, 'in_progress')}
                      >
                        In Progress
                      </AdminButton>
                    ) : null}
                    {submission.status !== 'resolved' ? (
                      <AdminButton
                        size="sm"
                        variant="outline"
                        disabled={pendingId === submission.id}
                        onClick={() => handleStatusChange(submission.id, 'resolved')}
                      >
                        Resolve
                      </AdminButton>
                    ) : null}
                  </div>
                </div>
              </AdminCardBody>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
