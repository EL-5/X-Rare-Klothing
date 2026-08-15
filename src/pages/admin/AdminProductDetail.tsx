import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Archive, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminInput, AdminTextarea, AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminBadge, type AdminBadgeVariant } from '@/components/admin/ui/AdminBadge';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { ProductVariantsEditor } from '@/components/admin/products/ProductVariantsEditor';
import { ProductImagesManager } from '@/components/admin/products/ProductImagesManager';
import { ProductCollectionsPicker } from '@/components/admin/products/ProductCollectionsPicker';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { brandService } from '@/services/brandService';
import { useToast } from '@/stores/ToastStore';
import type { Category } from '@/repositories/categoryRepository';
import type { BrandSummary, Product } from '@/types/domain';
import type { ProductStatus } from '@/types/database';

const STATUS_VARIANT: Record<ProductStatus, AdminBadgeVariant> = { active: 'success', draft: 'neutral', archived: 'warning' };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function AdminProductDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === undefined || id === 'new';
  const navigate = useNavigate();
  const { show } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  useEffect(() => {
    categoryService.list().then(setCategories);
    brandService.listSummaries().then(setBrands);
  }, []);

  const loadProduct = () => {
    if (isNew || !id) return;
    setLoading(true);
    productService.getById(id).then((result) => {
      setProduct(result);
      if (result) {
        setName(result.title);
        setSlug(result.slug);
        setDescription(result.description ?? '');
        setBrandId(result.brand?.id ?? '');
        setTags(result.tags.join(', '));
        setStatus(result.status);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const input = {
        name,
        slug,
        description: description || undefined,
        brandId: brandId || null,
        categoryId: categoryId || null,
        status,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
      };

      if (isNew) {
        const created = await productService.create(input);
        show({ title: 'Product created', variant: 'success' });
        navigate(`/admin/products/${created.id}`, { replace: true });
      } else if (id) {
        await productService.update(id, input);
        show({ title: 'Product saved', variant: 'success' });
      }
    } catch (err) {
      show({ title: 'Could not save product', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await productService.remove(id);
      show({ title: 'Product deleted', variant: 'success' });
      navigate('/admin/products', { replace: true });
    } catch (err) {
      show({ title: 'Could not delete product', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleTransition = async (action: 'publish' | 'unpublish' | 'archive') => {
    if (!id) return;
    setIsTransitioning(true);
    try {
      const updated = await productService[action](id);
      setStatus(updated.status);
      setProduct(updated);
      show({ title: `Product ${action === 'unpublish' ? 'moved to draft' : action + 'd'}`, variant: 'success' });
    } catch (err) {
      show({ title: `Could not ${action} product`, description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    setIsDuplicating(true);
    try {
      const duplicate = await productService.duplicate(id);
      show({ title: 'Product duplicated', description: 'The copy was created as a draft.', variant: 'success' });
      navigate(`/admin/products/${duplicate.id}`);
    } catch (err) {
      show({ title: 'Could not duplicate product', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDuplicating(false);
    }
  };

  if (loading) {
    return <AdminSkeleton className="h-96 w-full" />;
  }

  if (!isNew && !product) {
    return (
      <div>
        <AdminPageHeader title="Product not found" />
        <AdminButton variant="outline" onClick={() => navigate('/admin/products')}>
          Back to products
        </AdminButton>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={isNew ? 'New product' : name}
        description={!isNew ? <AdminBadge variant={STATUS_VARIANT[status]}>{status}</AdminBadge> : undefined}
        actions={
          !isNew ? (
            <>
              {status !== 'active' ? (
                <AdminButton variant="outline" size="sm" isLoading={isTransitioning} onClick={() => handleTransition('publish')}>
                  <Eye className="h-4 w-4" /> Publish
                </AdminButton>
              ) : (
                <AdminButton variant="outline" size="sm" isLoading={isTransitioning} onClick={() => handleTransition('unpublish')}>
                  <EyeOff className="h-4 w-4" /> Unpublish
                </AdminButton>
              )}
              {status !== 'archived' ? (
                <AdminButton variant="outline" size="sm" isLoading={isTransitioning} onClick={() => handleTransition('archive')}>
                  <Archive className="h-4 w-4" /> Archive
                </AdminButton>
              ) : null}
              <AdminButton variant="outline" size="sm" isLoading={isDuplicating} onClick={handleDuplicate}>
                <Copy className="h-4 w-4" /> Duplicate
              </AdminButton>
              <AdminButton variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </AdminButton>
            </>
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-4">
              <AdminInput label="Name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
              <AdminInput
                label="Slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
              />
              <AdminTextarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <AdminInput label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">SEO</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-4">
              <AdminInput label="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              <AdminTextarea label="SEO description" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} />
            </AdminCardBody>
          </AdminCard>

          {!isNew && product ? <ProductImagesManager productId={product.id} variants={product.variants} /> : null}
          {!isNew && product ? <ProductVariantsEditor product={product} onChange={setProduct} /> : null}
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard>
            <AdminCardHeader>
              <h2 className="text-sm font-semibold text-slate-900">Organization</h2>
            </AdminCardHeader>
            <AdminCardBody className="flex flex-col gap-4">
              <AdminSelect
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <AdminSelect
                label="Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={[{ value: '', label: 'None' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              />
              <AdminSelect
                label="Brand"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                options={[{ value: '', label: 'None' }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
              />
            </AdminCardBody>
          </AdminCard>

          {!isNew && product ? <ProductCollectionsPicker productId={product.id} /> : null}

          <AdminButton type="submit" isLoading={isSaving} className="w-full">
            {isNew ? 'Create product' : 'Save changes'}
          </AdminButton>
        </div>
      </form>

      <AdminConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete this product?"
        description="This permanently removes the product and its variants. This can't be undone."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
