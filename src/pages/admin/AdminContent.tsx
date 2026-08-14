import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput, AdminTextarea, AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminBadge, type AdminBadgeVariant } from '@/components/admin/ui/AdminBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import { contentService } from '@/services/contentService';
import { cn } from '@/lib/cn';
import type { BlogPost, Page } from '@/repositories/contentRepository';
import type { ContentStatus } from '@/types/database';

const STATUS_VARIANT: Record<ContentStatus, AdminBadgeVariant> = { draft: 'neutral', published: 'success', archived: 'warning' };

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface FormState {
  slug: string;
  title: string;
  body: string;
  excerpt: string;
  status: ContentStatus;
}

const emptyForm: FormState = { slug: '', title: '', body: '', excerpt: '', status: 'draft' };

export function AdminContent() {
  const { show } = useToast();
  const [tab, setTab] = useState<'pages' | 'blog'>('pages');
  const [pages, setPages] = useState<Page[] | null>(null);
  const [posts, setPosts] = useState<BlogPost[] | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPages = () => contentService.listPages().then(setPages);
  const loadPosts = () => contentService.listBlogPosts().then(setPosts);

  useEffect(() => {
    void loadPages();
    void loadPosts();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setSlugTouched(false);
    setEditingId(null);
    setShowForm(true);
  };

  const startEditPage = (page: Page) => {
    setForm({ slug: page.slug, title: page.title, body: page.body ?? '', excerpt: '', status: page.status });
    setSlugTouched(true);
    setEditingId(page.id);
    setShowForm(true);
  };

  const startEditPost = (post: BlogPost) => {
    setForm({ slug: post.slug, title: post.title, body: post.body ?? '', excerpt: post.excerpt ?? '', status: post.status });
    setSlugTouched(true);
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (tab === 'pages') {
        const input = { slug: form.slug, title: form.title, body: form.body, status: form.status };
        if (editingId) await contentService.updatePage(editingId, input);
        else await contentService.createPage(input);
        await loadPages();
      } else {
        const input = { slug: form.slug, title: form.title, body: form.body, excerpt: form.excerpt, status: form.status };
        if (editingId) await contentService.updateBlogPost(editingId, input);
        else await contentService.createBlogPost(input);
        await loadPosts();
      }
      setShowForm(false);
      show({ title: 'Saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      if (tab === 'pages') {
        await contentService.removePage(deletingId);
        await loadPages();
      } else {
        await contentService.removeBlogPost(deletingId);
        await loadPosts();
      }
      show({ title: 'Deleted', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not delete', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const items = tab === 'pages' ? pages : posts;

  return (
    <div>
      <AdminPageHeader
        title="Content"
        description="Static pages and blog posts."
        actions={
          <AdminButton onClick={startCreate}>
            <Plus className="h-4 w-4" /> New {tab === 'pages' ? 'page' : 'post'}
          </AdminButton>
        }
      />

      <div className="mb-4 flex rounded-md border border-slate-300 bg-white p-0.5 w-fit">
        {(['pages', 'blog'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setShowForm(false);
            }}
            className={cn('rounded px-3 py-1.5 text-sm font-medium capitalize', tab === t ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
          >
            {t === 'blog' ? 'Blog posts' : 'Pages'}
          </button>
        ))}
      </div>

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
              {tab === 'blog' ? (
                <AdminTextarea
                  containerClassName="sm:col-span-2"
                  label="Excerpt"
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                />
              ) : null}
              <AdminTextarea
                containerClassName="sm:col-span-2"
                label="Body"
                rows={6}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
              <AdminSelect
                label="Status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ContentStatus }))}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <div className="flex gap-2 self-end sm:col-span-2">
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

      {items === null ? (
        <AdminTableSkeleton />
      ) : items.length === 0 ? (
        <AdminEmptyState title={`No ${tab === 'pages' ? 'pages' : 'blog posts'} yet`} action={<AdminButton size="sm" onClick={startCreate}>New {tab === 'pages' ? 'page' : 'post'}</AdminButton>} />
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
              {items.map((item) => (
                <AdminTr key={item.id}>
                  <AdminTd>
                    <button
                      type="button"
                      onClick={() => (tab === 'pages' ? startEditPage(item as Page) : startEditPost(item as BlogPost))}
                      className="font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {item.title}
                    </button>
                  </AdminTd>
                  <AdminTd className="text-slate-500">{item.slug}</AdminTd>
                  <AdminTd>
                    <AdminBadge variant={STATUS_VARIANT[item.status]}>{item.status}</AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <button type="button" onClick={() => setDeletingId(item.id)} aria-label="Delete" className="text-red-500 hover:text-red-700">
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
        title={`Delete this ${tab === 'pages' ? 'page' : 'post'}?`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
