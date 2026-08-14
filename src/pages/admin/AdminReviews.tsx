import { useEffect, useState } from 'react';
import { Check, Star, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminBadge, type AdminBadgeVariant } from '@/components/admin/ui/AdminBadge';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { useToast } from '@/stores/ToastStore';
import { reviewService } from '@/services/reviewService';
import type { ReviewWithContext } from '@/repositories/reviewRepository';
import type { ReviewStatus } from '@/types/domain';

const STATUS_VARIANT: Record<ReviewStatus, AdminBadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export function AdminReviews() {
  const { show } = useToast();
  const [status, setStatus] = useState<ReviewStatus | ''>('pending');
  const [reviews, setReviews] = useState<ReviewWithContext[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = () => reviewService.listForAdmin(status || undefined).then(setReviews);

  useEffect(() => {
    setReviews(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleStatusChange = async (id: string, next: ReviewStatus) => {
    setPendingId(id);
    try {
      await reviewService.updateStatus(id, next);
      await load();
      show({ title: `Review ${next}`, variant: 'success' });
    } catch (err) {
      show({ title: 'Could not update review', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingId(id);
    try {
      await reviewService.remove(id);
      await load();
      show({ title: 'Review deleted', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not delete review', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Reviews" description="Moderate customer reviews before they appear on product pages." />

      <div className="mb-4">
        <AdminSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as ReviewStatus | '')}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: '', label: 'All' },
          ]}
          className="w-40"
        />
      </div>

      {reviews === null ? (
        <AdminTableSkeleton />
      ) : reviews.length === 0 ? (
        <AdminEmptyState title="No reviews here" description="Nothing matches this filter right now." />
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <AdminCard key={review.id}>
              <AdminCardBody>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{review.productName}</p>
                      <AdminBadge variant={STATUS_VARIANT[review.status]}>{review.status}</AdminBadge>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="ml-2 text-xs text-slate-500">{review.customerEmail}</span>
                    </div>
                    {review.title ? <p className="mt-2 text-sm font-medium text-slate-800">{review.title}</p> : null}
                    {review.body ? <p className="mt-1 text-sm text-slate-600">{review.body}</p> : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {review.status !== 'approved' ? (
                      <AdminButton
                        size="sm"
                        variant="outline"
                        disabled={pendingId === review.id}
                        onClick={() => handleStatusChange(review.id, 'approved')}
                      >
                        <Check className="h-4 w-4" /> Approve
                      </AdminButton>
                    ) : null}
                    {review.status !== 'rejected' ? (
                      <AdminButton
                        size="sm"
                        variant="outline"
                        disabled={pendingId === review.id}
                        onClick={() => handleStatusChange(review.id, 'rejected')}
                      >
                        <X className="h-4 w-4" /> Reject
                      </AdminButton>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={pendingId === review.id}
                      aria-label="Delete review"
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
