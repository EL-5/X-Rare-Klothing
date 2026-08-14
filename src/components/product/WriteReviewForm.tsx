import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/stores/AuthStore';
import { reviewService } from '@/services/reviewService';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/cn';
import type { Review } from '@/types/domain';

export interface WriteReviewFormProps {
  productId: string;
  onSubmitted: (review: Review) => void;
}

function StarInput({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;
        return (
          <button key={rating} type="button" onClick={() => onChange(rating)} aria-label={`${rating} star${rating === 1 ? '' : 's'}`}>
            <Star className={cn('h-6 w-6', rating <= value ? 'fill-ink text-ink' : 'text-border')} />
          </button>
        );
      })}
    </div>
  );
}

/** Gated to signed-in customers with a qualifying purchase — the server (reviews_enforce_verified_purchase trigger) is the real guard; this just avoids showing a form that would only ever fail. */
export function WriteReviewForm({ productId, onSubmitted }: WriteReviewFormProps) {
  const { isAuthenticated, profile } = useAuth();
  const [eligibility, setEligibility] = useState<'checking' | 'ineligible' | 'already-reviewed' | 'eligible'>('checking');
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setEligibility('checking');
    Promise.all([reviewService.hasPurchased(productId, profile.id), reviewService.getOwnReview(productId, profile.id)]).then(
      ([purchased, own]) => {
        if (cancelled) return;
        if (own) {
          setExistingReview(own);
          setEligibility('already-reviewed');
        } else {
          setEligibility(purchased ? 'eligible' : 'ineligible');
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [productId, profile]);

  if (!isAuthenticated || !profile) {
    return (
      <p className="text-sm text-ink/60">
        <Link to={ROUTES.login} className="underline-offset-2 hover:underline">
          Log in
        </Link>{' '}
        to write a review.
      </p>
    );
  }

  if (eligibility === 'checking') return null;

  if (eligibility === 'ineligible') {
    return <p className="text-sm text-ink/60">Only customers who purchased this product can leave a review.</p>;
  }

  if (eligibility === 'already-reviewed') {
    return (
      <p className="text-sm text-ink/60">
        You've already reviewed this product
        {existingReview && existingReview.status === 'pending' ? ' — it is awaiting moderation.' : '.'}
      </p>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating < 1) {
      setError('Select a star rating.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const review = await reviewService.submit({
        productId,
        profileId: profile.id,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        images,
      });
      onSubmitted(review);
      setExistingReview(review);
      setEligibility('already-reviewed');
      setRating(0);
      setTitle('');
      setBody('');
      setImages([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink">Your Rating</p>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <Input label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-ink/70" htmlFor="review-body">
          Comment (optional)
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          className="rounded-[var(--radius-input)] border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>
      <div>
        <label className="text-sm text-ink/70" htmlFor="review-images">
          Photos (optional)
        </label>
        <input
          id="review-images"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          className="mt-1.5 block text-sm text-ink/70"
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Submit Review
      </Button>
    </form>
  );
}
