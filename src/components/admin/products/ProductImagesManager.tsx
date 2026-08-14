import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Star, Trash2, Upload } from 'lucide-react';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import { productImageService } from '@/services/productImageService';
import type { ProductImage } from '@/repositories/productImageRepository';
import type { ProductVariant } from '@/types/domain';

export interface ProductImagesManagerProps {
  productId: string;
  /** Lets each image be pinned to a specific variant (e.g. the "Black" colorway's photos) — optional since new products have no variants yet. */
  variants?: ProductVariant[];
}

function variantLabel(variant: ProductVariant): string {
  return [variant.color, variant.size, variant.material].filter(Boolean).join(' / ') || variant.sku;
}

export function ProductImagesManager({ productId, variants = [] }: ProductImagesManagerProps) {
  const { show } = useToast();
  const [images, setImages] = useState<ProductImage[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => productImageService.list(productId).then(setImages);

  useEffect(() => {
    void load();
  }, [productId]);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await productImageService.upload(productId, file);
      }
      await load();
      show({ title: 'Image(s) uploaded', variant: 'success' });
    } catch (err) {
      show({ title: 'Upload failed', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!images) return;
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    setImages(reordered);
    await productImageService.reorder(productId, reordered.map((img) => img.id));
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!images) return;
    await productImageService.setPrimary(productId, imageId, images.map((img) => img.id));
    await load();
  };

  const handleAssignVariant = async (imageId: string, variantId: string) => {
    await productImageService.assignToVariant(imageId, variantId || null);
    await load();
  };

  const handleDelete = async () => {
    if (!deletingId || !images) return;
    const image = images.find((img) => img.id === deletingId);
    if (!image) return;
    setIsDeleting(true);
    try {
      await productImageService.remove(image.id, image.url);
      await load();
      show({ title: 'Image removed', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not remove image', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  return (
    <AdminCard>
      <AdminCardHeader className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Images</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <AdminButton size="sm" variant="outline" isLoading={isUploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload
          </AdminButton>
        </div>
      </AdminCardHeader>
      <AdminCardBody>
        {images === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-sm text-slate-500">No images yet. Upload one to get started.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {images.map((image, index) => (
              <div key={image.id} className="flex flex-col gap-1.5">
                <div className="group relative overflow-hidden rounded-md border border-slate-200">
                  <img src={image.url} alt="" className="aspect-square w-full object-cover" />
                  {index === 0 ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Primary
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-slate-900/70 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move earlier" className="text-white disabled:opacity-30">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    {index !== 0 ? (
                      <button type="button" onClick={() => handleSetPrimary(image.id)} aria-label="Set as primary" className="text-white">
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button type="button" onClick={() => setDeletingId(image.id)} aria-label="Delete image" className="text-white">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" disabled={index === images.length - 1} onClick={() => move(index, 1)} aria-label="Move later" className="text-white disabled:opacity-30">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {variants.length > 0 ? (
                  <select
                    value={image.variantId ?? ''}
                    onChange={(e) => handleAssignVariant(image.id, e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600"
                  >
                    <option value="">General (all variants)</option>
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variantLabel(variant)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </AdminCardBody>

      <AdminConfirmDialog
        isOpen={deletingId !== null}
        title="Delete this image?"
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </AdminCard>
  );
}
