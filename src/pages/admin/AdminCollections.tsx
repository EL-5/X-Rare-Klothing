import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Trash2 } from 'lucide-react';
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
import { collectionService } from '@/services/collectionService';
import type { Collection } from '@/types/domain';
import type { CollectionInput } from '@/repositories/collectionRepository';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyForm: CollectionInput = { slug: '', title: '', description: '', image: '', isPublished: true };

export function AdminCollections() {
  const { show } = useToast();
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionInput>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const load = () => collectionService.list().then(setCollections);

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (collection: Collection) => {
    setForm({
      slug: collection.slug,
      title: collection.title,
      description: collection.description ?? '',
      image: collection.image ?? '',
      isPublished: collection.isPublished,
    });
    setSlugTouched(true);
    setEditingId(collection.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await collectionService.update(editingId, form);
      } else {
        await collectionService.create(form);
      }
      setShowForm(false);
      await load();
      show({ title: 'Collection saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save collection', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (collection: Collection) => {
    setPendingToggleId(collection.id);
    try {
      if (collection.isPublished) await collectionService.unpublish(collection.id);
      else await collectionService.publish(collection.id);
      await load();
    } catch (err) {
      show({ title: 'Could not update collection', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setPendingToggleId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await collectionService.remove(deletingId);
      await load();
      show({ title: 'Collection deleted', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not delete collection', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Collections"
        description="Marketing groupings shown on the storefront."
        actions={
          <AdminButton onClick={startCreate}>
            <Plus className="h-4 w-4" /> New collection
          </AdminButton>
        }
      />

      {showForm ? (
        <AdminCard className="mb-6">
          <AdminCardBody>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="Title"
                required
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
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
              <AdminTextarea
                containerClassName="sm:col-span-2"
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <AdminInput
                containerClassName="sm:col-span-2"
                label="Image URL"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                Published (visible on the storefront)
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

      {collections === null ? (
        <AdminTableSkeleton />
      ) : collections.length === 0 ? (
        <AdminEmptyState title="No collections yet" action={<AdminButton size="sm" onClick={startCreate}>New collection</AdminButton>} />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>Title</AdminTh>
                <AdminTh>Slug</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh />
              </tr>
            </AdminTHead>
            <AdminTBody>
              {collections.map((collection) => (
                <AdminTr key={collection.id}>
                  <AdminTd>
                    <button type="button" onClick={() => startEdit(collection)} className="font-medium text-slate-900 hover:text-indigo-600">
                      {collection.title}
                    </button>
                  </AdminTd>
                  <AdminTd className="text-slate-500">{collection.slug}</AdminTd>
                  <AdminTd>
                    <button type="button" disabled={pendingToggleId === collection.id} onClick={() => handleTogglePublish(collection)}>
                      <AdminBadge variant={collection.isPublished ? 'success' : 'neutral'}>
                        {collection.isPublished ? 'Published' : 'Unpublished'}
                      </AdminBadge>
                    </button>
                  </AdminTd>
                  <AdminTd>
                    <div className="flex items-center gap-3">
                      <Link to={`/admin/collections/${collection.id}`} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                        <Package className="h-3.5 w-3.5" /> Products
                      </Link>
                      <button type="button" onClick={() => setDeletingId(collection.id)} aria-label="Delete collection" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTBody>
          </AdminTable>
        </AdminTableCard>
      )}

      <AdminConfirmDialog
        isOpen={deletingId !== null}
        title="Delete this collection?"
        description="Products stay in the catalog; only the grouping is removed."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
