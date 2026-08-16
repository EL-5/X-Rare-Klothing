import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput, AdminTextarea } from '@/components/admin/ui/AdminInput';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import { brandService } from '@/services/brandService';
import type { Brand, BrandInput } from '@/types/domain';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyForm: BrandInput = { name: '', slug: '', logo: '', coverImage: '', description: '', country: '', website: '', isPublished: true, isFeatured: false };

export function AdminBrands() {
  const { show } = useToast();
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BrandInput>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => brandService.listForAdmin().then(setBrands);

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (brand: Brand) => {
    setForm({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo ?? '',
      coverImage: brand.coverImage ?? '',
      description: brand.description ?? '',
      country: brand.country ?? '',
      website: brand.website ?? '',
      isPublished: brand.isPublished,
      isFeatured: brand.isFeatured,
    });
    setSlugTouched(true);
    setEditingId(brand.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await brandService.update(editingId, form);
      } else {
        await brandService.create(form);
      }
      setShowForm(false);
      await load();
      show({ title: 'Brand saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save brand', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await brandService.remove(deletingId);
      await load();
      show({ title: 'Brand deleted', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not delete brand', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Brands"
        description="X-Rare's own label plus every third-party brand curated on the storefront."
        actions={
          <AdminButton onClick={startCreate}>
            <Plus className="h-4 w-4" /> New brand
          </AdminButton>
        }
      />

      {showForm ? (
        <AdminCard className="mb-6">
          <AdminCardBody>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="Name"
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
                }}
              />
              <AdminInput
                label="Slug"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
              <AdminInput label="Country" value={form.country ?? ''} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
              <AdminInput label="Website" value={form.website ?? ''} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
              <AdminInput label="Logo URL" value={form.logo ?? ''} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} />
              <AdminInput
                label="Cover image URL"
                value={form.coverImage ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
              />
              <AdminTextarea
                containerClassName="sm:col-span-2"
                label="Description"
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              {form.coverImage ? (
                <img src={form.coverImage} alt="" className="h-24 w-24 rounded-md border border-slate-200 object-cover sm:col-span-2" />
              ) : null}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isPublished ?? true} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isFeatured ?? false} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} />
                Featured
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <AdminButton type="submit" isLoading={isSaving}>
                  Save
                </AdminButton>
                <AdminButton type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </AdminButton>
              </div>
            </form>
          </AdminCardBody>
        </AdminCard>
      ) : null}

      {brands === null ? (
        <AdminTableSkeleton />
      ) : brands.length === 0 ? (
        <AdminEmptyState title="No brands yet" action={<AdminButton size="sm" onClick={startCreate}>New brand</AdminButton>} />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>Name</AdminTh>
                <AdminTh>Country</AdminTh>
                <AdminTh>Products</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh />
              </tr>
            </AdminTHead>
            <AdminTBody>
              {brands.map((brand, index) => (
                <AdminTr key={brand.id} index={index}>
                  <AdminTd>
                    <button type="button" onClick={() => startEdit(brand)} className="font-medium text-slate-900 hover:text-indigo-600">
                      {brand.name}
                    </button>
                  </AdminTd>
                  <AdminTd className="text-slate-500">{brand.country ?? '—'}</AdminTd>
                  <AdminTd className="text-slate-500">{brand.productCount}</AdminTd>
                  <AdminTd>
                    <div className="flex gap-1.5">
                      <AdminBadge variant={brand.isPublished ? 'success' : 'neutral'}>{brand.isPublished ? 'Published' : 'Unpublished'}</AdminBadge>
                      {brand.isFeatured ? <AdminBadge variant="warning">Featured</AdminBadge> : null}
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <button type="button" onClick={() => setDeletingId(brand.id)} aria-label="Delete brand" className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTBody>
          </AdminTable>
        </AdminTableCard>
      )}

      <AdminConfirmDialog
        isOpen={deletingId !== null}
        title="Delete this brand?"
        description="Products assigned to this brand will lose their brand assignment."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
