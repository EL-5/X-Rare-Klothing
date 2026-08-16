import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput, AdminTextarea, AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import { categoryService } from '@/services/categoryService';
import type { Category, CategoryInput } from '@/repositories/categoryRepository';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyForm: CategoryInput = { slug: '', name: '', description: '', parentId: null, image: '' };

export function AdminCategories() {
  const { show } = useToast();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => categoryService.list().then(setCategories);

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (category: Category) => {
    setForm({ slug: category.slug, name: category.name, description: category.description ?? '', parentId: category.parentId, image: category.image ?? '' });
    setSlugTouched(true);
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await categoryService.update(editingId, form);
      } else {
        await categoryService.create(form);
      }
      setShowForm(false);
      await load();
      show({ title: 'Category saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save category', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await categoryService.remove(deletingId);
      await load();
      show({ title: 'Category deleted', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not delete category', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const parentName = (parentId: string | null) => categories?.find((c) => c.id === parentId)?.name ?? '—';

  /** Depth-first order (roots, then their children, recursively) with a depth per row — turns the flat list into a visual tree via indentation. */
  const orderedWithDepth = (): { category: Category; depth: number }[] => {
    if (!categories) return [];
    const byParent = new Map<string | null, Category[]>();
    for (const category of categories) {
      const key = category.parentId;
      byParent.set(key, [...(byParent.get(key) ?? []), category]);
    }
    const result: { category: Category; depth: number }[] = [];
    const visit = (parentId: string | null, depth: number) => {
      for (const category of byParent.get(parentId) ?? []) {
        result.push({ category, depth });
        visit(category.id, depth + 1);
      }
    };
    visit(null, 0);
    return result;
  };

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Primary catalog hierarchy."
        actions={
          <AdminButton onClick={startCreate}>
            <Plus className="h-4 w-4" /> New category
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
              <AdminSelect
                label="Parent category"
                value={form.parentId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
                options={[
                  { value: '', label: 'None (top level)' },
                  ...(categories ?? []).filter((c) => c.id !== editingId).map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <AdminTextarea
                containerClassName="sm:col-span-2"
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <AdminInput
                containerClassName="sm:col-span-2"
                label="Image URL"
                placeholder="https://…"
                value={form.image ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              />
              {form.image ? (
                <img src={form.image} alt="" className="h-24 w-24 rounded-md border border-slate-200 object-cover sm:col-span-2" />
              ) : null}
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

      {categories === null ? (
        <AdminTableSkeleton />
      ) : categories.length === 0 ? (
        <AdminEmptyState title="No categories yet" action={<AdminButton size="sm" onClick={startCreate}>New category</AdminButton>} />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh />
                <AdminTh>Name</AdminTh>
                <AdminTh>Slug</AdminTh>
                <AdminTh>Parent</AdminTh>
                <AdminTh />
              </tr>
            </AdminTHead>
            <AdminTBody>
              {orderedWithDepth().map(({ category, depth }, index) => (
                <AdminTr key={category.id} index={index}>
                  <AdminTd>
                    {category.image ? (
                      <img src={category.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-slate-100" />
                    )}
                  </AdminTd>
                  <AdminTd>
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      style={{ paddingLeft: depth * 20 }}
                      className="font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {depth > 0 ? <span className="mr-1 text-slate-300">└</span> : null}
                      {category.name}
                    </button>
                  </AdminTd>
                  <AdminTd className="text-slate-500">{category.slug}</AdminTd>
                  <AdminTd className="text-slate-500">{parentName(category.parentId)}</AdminTd>
                  <AdminTd>
                    <button type="button" onClick={() => setDeletingId(category.id)} aria-label="Delete category" className="text-red-500 hover:text-red-700">
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
        title="Delete this category?"
        description="Products in this category will lose their category assignment."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
