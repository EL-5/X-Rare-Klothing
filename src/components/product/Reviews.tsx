import { useEffect, useState } from 'react';
import { Star, BadgeCheck } from 'lucide-react';
import { reviewService } from '@/services/reviewService';
import { cn } from '@/lib/cn';
import type { Review } from '@/types/domain';

export interface ReviewsProps {
  productId: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={cn('h-3.5 w-3.5', index < rating ? 'fill-ink text-ink' : 'text-border')} aria-hidden="true" />
      ))}
    </div>
  );
}

/** RLS already scopes reviewService.listForProduct to approved ("verified") reviews for anonymous/customer callers — see reviewRepository. */
export function Reviews({ productId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [average, setAverage] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReviews(null);
    Promise.all([reviewService.listForProduct(productId), reviewService.getAverageRating(productId)]).then(([list, avg]) => {
      if (cancelled) return;
      setReviews(list);
      setAverage(avg);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (reviews && reviews.length === 0) {
    return (
      <section className="mx-auto max-w-[var(--container-max)] px-6 py-[var(--spacing-section-mobile)] lg:px-8 lg:py-[var(--spacing-section-desktop)]">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Reviews</h2>
        <p className="mt-3 text-sm text-ink/60">No reviews yet for this product.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 py-[var(--spacing-section-mobile)] lg:px-8 lg:py-[var(--spacing-section-desktop)]">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Reviews</h2>
        {average !== null ? (
          <div className="flex items-center gap-2">
            <StarRow rating={Math.round(average)} />
            <span className="text-xs text-ink/60">
              {average.toFixed(1)} ({reviews?.length ?? 0})
            </span>
          </div>
        ) : null}
      </div>

      {reviews === null ? (
        <p className="mt-4 text-sm text-ink/50">Loading reviews…</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-6">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-center justify-between gap-4">
                <StarRow rating={review.rating} />
                <div className="flex items-center gap-3">
                  {review.orderId ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified Purchase
                    </span>
                  ) : null}
                  <time className="text-xs text-ink/40">{new Date(review.createdAt).toLocaleDateString()}</time>
                </div>
              </div>
              {review.title ? <p className="mt-2 text-sm font-medium text-ink">{review.title}</p> : null}
              {review.body ? <p className="mt-1 text-sm text-ink/70">{review.body}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
