const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Client-side pre-check mirroring the storage bucket's own
 * allowed_mime_types/file_size_limit (see migration 0036) — this only
 * saves a round trip with a friendlier error message; the bucket
 * constraint is what actually enforces it.
 */
export function assertValidImageFile(file: File): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Please choose a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }
}
