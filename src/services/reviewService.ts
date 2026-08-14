import { reviewRepository, type ReviewWithContext } from '@/repositories/reviewRepository';
import type { Review, ReviewStatus } from '@/types/domain';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES_PER_REVIEW = 5;

export interface ReviewService {
  listForProduct(productId: string): Promise<Review[]>;
  getAverageRating(productId: string): Promise<number | null>;
  hasPurchased(productId: string, profileId: string): Promise<boolean>;
  getOwnReview(productId: string, profileId: string): Promise<Review | null>;
  submit(input: {
    productId: string;
    profileId: string;
    rating: number;
    title?: string;
    body?: string;
    images?: File[];
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

  hasPurchased(productId: string, profileId: string): Promise<boolean> {
    return reviewRepository.hasPurchased(productId, profileId);
  }

  getOwnReview(productId: string, profileId: string): Promise<Review | null> {
    return reviewRepository.getOwnReview(productId, profileId);
  }

  async submit(input: {
    productId: string;
    profileId: string;
    rating: number;
    title?: string;
    body?: string;
    images?: File[];
  }): Promise<Review> {
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5.');
    }
    const images = input.images ?? [];
    if (images.length > MAX_IMAGES_PER_REVIEW) {
      throw new Error(`You can attach up to ${MAX_IMAGES_PER_REVIEW} images.`);
    }
    for (const file of images) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Please upload JPEG, PNG, WebP, or GIF images.');
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Images must be under 5MB.');
      }
    }

    const review = await reviewRepository.create(input);
    for (const file of images) {
      await reviewRepository.uploadImage(review.id, file);
    }
    return images.length > 0 ? ((await reviewRepository.getOwnReview(input.productId, input.profileId)) ?? review) : review;
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
