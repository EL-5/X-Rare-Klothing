import { productImageRepository, type ProductImage } from '@/repositories/productImageRepository';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface ProductImageService {
  list(productId: string): Promise<ProductImage[]>;
  upload(productId: string, file: File): Promise<ProductImage>;
  remove(imageId: string, url: string): Promise<void>;
  reorder(productId: string, orderedImageIds: string[]): Promise<void>;
  setPrimary(productId: string, imageId: string, currentOrder: string[]): Promise<void>;
  assignToVariant(imageId: string, variantId: string | null): Promise<void>;
}

class SupabaseProductImageService implements ProductImageService {
  list(productId: string): Promise<ProductImage[]> {
    return productImageRepository.list(productId);
  }

  upload(productId: string, file: File): Promise<ProductImage> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('Images must be under 5MB.');
    }
    return productImageRepository.upload(productId, file);
  }

  remove(imageId: string, url: string): Promise<void> {
    return productImageRepository.remove(imageId, url);
  }

  reorder(productId: string, orderedImageIds: string[]): Promise<void> {
    return productImageRepository.reorder(productId, orderedImageIds);
  }

  setPrimary(productId: string, imageId: string, currentOrder: string[]): Promise<void> {
    const reordered = [imageId, ...currentOrder.filter((id) => id !== imageId)];
    return productImageRepository.reorder(productId, reordered);
  }

  assignToVariant(imageId: string, variantId: string | null): Promise<void> {
    return productImageRepository.assignToVariant(imageId, variantId);
  }
}

export const productImageService: ProductImageService = new SupabaseProductImageService();
