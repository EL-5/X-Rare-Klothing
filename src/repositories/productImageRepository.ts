import { supabase } from '@/lib/supabase';
import { assertValidImageFile } from '@/utils/fileValidation';

const BUCKET = 'product-images';

export interface ProductImage {
  id: string;
  url: string;
  position: number;
  variantId: string | null;
}

function toProductImage(row: { id: string; url: string; position: number; variant_id: string | null }): ProductImage {
  return { id: row.id, url: row.url, position: row.position, variantId: row.variant_id };
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

export const productImageRepository = {
  async list(productId: string): Promise<ProductImage[]> {
    const { data, error } = await supabase
      .from('product_images')
      .select('id, url, position, variant_id')
      .eq('product_id', productId)
      .order('position');
    if (error) throw error;
    return (data ?? []).map(toProductImage);
  },

  /** Uploads to Supabase Storage, then creates the `product_images` row pointing at the public URL. New images append to the end (highest position). */
  async upload(productId: string, file: File): Promise<ProductImage> {
    assertValidImageFile(file);
    const path = `${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { count } = await supabase
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);

    const { data, error } = await supabase
      .from('product_images')
      .insert({ product_id: productId, url: publicUrl, position: count ?? 0 })
      .select('id, url, position, variant_id')
      .single();
    if (error) throw error;
    return toProductImage(data);
  },

  async remove(imageId: string, url: string): Promise<void> {
    const path = storagePathFromUrl(url);
    if (path) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
      // Swallow "not found" (already-deleted object) but surface anything else.
      if (storageError && !/not.?found/i.test(storageError.message)) throw storageError;
    }

    const { error } = await supabase.from('product_images').delete().eq('id', imageId);
    if (error) throw error;
  },

  /** Persists a full reordering — position 0 is the primary/cover image. */
  async reorder(productId: string, orderedImageIds: string[]): Promise<void> {
    await Promise.all(
      orderedImageIds.map((imageId, index) =>
        supabase.from('product_images').update({ position: index }).eq('id', imageId).eq('product_id', productId),
      ),
    );
  },

  /** Pins an image to a specific variant (e.g. the "Black" colorway's photos), or clears the pin with `variantId: null` for a general product image. */
  async assignToVariant(imageId: string, variantId: string | null): Promise<void> {
    const { error } = await supabase.from('product_images').update({ variant_id: variantId }).eq('id', imageId);
    if (error) throw error;
  },
};
