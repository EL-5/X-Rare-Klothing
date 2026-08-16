import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput, AdminTextarea, AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import { faqService, FAQ_CATEGORY_LABELS } from '@/services/faqService';
import type { Faq, FaqCategory, FaqInput } from '@/types/domain';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const CATEGORY_OPTIONS = (Object.entries(FAQ_CATEGORY_LABELS) as [FaqCategory, string][]).map(([value, label]) => ({ value, label }));

const emptyForm: FaqInput = { question: '', answer: '', category: 'orders', slug: '', isPublished: true };

export function AdminFAQs() {
  const { show } = useToast();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FaqInput>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => faqService.listForAdmin().then(setFaqs);

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (faq: Faq) => {
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, slug: faq.slug, isPublished: faq.isPublished });
    setSlugTouched(true);
    setEditingId(faq.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await faqService.update(editingId, form);
      } else {
        await faqService.create(form);
      }
      setShowForm(false);
      await load();
      show({ title: 'FAQ saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save FAQ', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (faq: Faq) => {
    try {
      await faqService.update(faq.id, { isPublished: !faq.isPublished });
      await load();
    } catch (err) {
      show({ title: 'Could not update FAQ', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await faqService.remove(deletingId);
      await load();
      show({ title: 'FAQ deleted', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not delete FAQ', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const move = async (category: FaqCategory, items: Faq[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    await faqService.reorder(category, reordered.map((f) => f.id));
    await load();
  };

  const grouped = new Map<FaqCategory, Faq[]>();
  for (const faq of faqs ?? []) {
    grouped.set(faq.category, [...(grouped.get(faq.category) ?? []), faq]);
  }

  return (
    <div>
      <AdminPageHeader
        title="FAQs"
        description="Content shown on the storefront's FAQ page."
        actions={
          <AdminButton onClick={startCreate}>
            <Plus className="h-4 w-4" /> New FAQ
          </AdminButton>
        }
      />

      {showForm ? (
        <AdminCard className="mb-6">
          <AdminCardBody>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                containerClassName="sm:col-span-2"
                label="Question"
                required
                value={form.question}
                onChange={(e) => {
                  const question = e.target.value;
                  setForm((f) => ({ ...f, question, slug: slugTouched ? f.slug : slugify(question) }));
                }}
              />
              <AdminSelect
                label="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as FaqCategory }))}
                options={CATEGORY_OPTIONS}
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
                label="Answer"
                required
                rows={4}
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isPublished ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                Published (visible on the storefront FAQ page)
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

      {faqs === null ? (
        <AdminTableSkeleton />
      ) : faqs.length === 0 ? (
        <AdminEmptyState title="No FAQs yet" action={<AdminButton size="sm" onClick={startCreate}>New FAQ</AdminButton>} />
      ) : (
        <div className="flex flex-col gap-8">
          {[...grouped.entries()].map(([category, items]) => (
            <div key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{FAQ_CATEGORY_LABELS[category]}</h2>
              <div className="flex flex-col gap-2">
                {items.map((faq, index) => (
                  <AdminCard key={faq.id} index={index}>
                    <AdminCardBody className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => startEdit(faq)} className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600">
                            {faq.question}
                          </button>
                          <AdminBadge variant={faq.isPublished ? 'success' : 'neutral'}>{faq.isPublished ? 'Published' : 'Unpublished'}</AdminBadge>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">{faq.answer}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" disabled={index === 0} onClick={() => move(category, items, index, -1)} aria-label="Move up" className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={index === items.length - 1} onClick={() => move(category, items, index, 1)} aria-label="Move down" className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <AdminButton size="sm" variant="outline" onClick={() => handleTogglePublish(faq)}>
                          {faq.isPublished ? 'Unpublish' : 'Publish'}
                        </AdminButton>
                        <button type="button" onClick={() => setDeletingId(faq.id)} aria-label="Delete FAQ" className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </AdminCardBody>
                  </AdminCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminConfirmDialog
        isOpen={deletingId !== null}
        title="Delete this FAQ?"
        description="It will be removed from the storefront FAQ page immediately."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
