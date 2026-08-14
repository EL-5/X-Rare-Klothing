import { reviewRepository, type ReviewWithContext } from '@/repositories/reviewRepository';
import type { Review, ReviewStatus } from '@/types/domain';

export interface ReviewService {
  listForProduct(productId: string): Promise<Review[]>;
  getAverageRating(productId: string): Promise<number | null>;
  submit(input: {
    productId: string;
    profileId: string;
    rating: number;
    title?: string;
    body?: string;
  }): Promise<Review>;
  listForAdmin(status?: ReviewStatus): Promise<ReviewWithContext[]>;
  updateStatus(id: string, status: ReviewStatus): Promise<Review>;
  remove(id: string): Promise<void>;
}

class SupabaseReviewService implements ReviewService {
  listForProduct(productId: string): Promise<Review[]> {
    return reviewRepository.listByProduct(productId);
  }

  async getAverageRating(productId: string): Promise<number | null> {
    const reviews = await reviewRepository.listByProduct(productId);
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }

  submit(input: {
    productId: string;
    profileId: string;
    rating: number;
    title?: string;
    body?: string;
  }): Promise<Review> {
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5.');
    }
    return reviewRepository.create(input);
  }

  listForAdmin(status?: ReviewStatus): Promise<ReviewWithContext[]> {
    return reviewRepository.listForAdmin(status);
  }

  updateStatus(id: string, status: ReviewStatus): Promise<Review> {
    return reviewRepository.updateStatus(id, status);
  }

  remove(id: string): Promise<void> {
    return reviewRepository.remove(id);
  }
}

export const reviewService: ReviewService = new SupabaseReviewService();
