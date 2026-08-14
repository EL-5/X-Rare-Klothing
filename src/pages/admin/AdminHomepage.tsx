import { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput, AdminTextarea, AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminCard, AdminCardBody, AdminCardHeader } from '@/components/admin/ui/AdminCard';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import { homepageSectionService } from '@/services/homepageSectionService';
import type { HomepageSectionInput } from '@/repositories/homepageSectionRepository';
import type { HomepageSection, HomepageSectionType } from '@/types/domain';
import type { HeroSlide } from '@/components/home/HeroCarousel';

const TYPE_LABELS: Record<HomepageSectionType, string> = {
  hero: 'Hero',
  product_carousel: 'Product Carousel',
  banner: 'Banner',
  editorial: 'Editorial',
  category_grid: 'Category Grid',
  newsletter: 'Newsletter',
};

const emptySlide = (): HeroSlide => ({
  id: crypto.randomUUID(),
  eyebrow: '',
  heading: '',
  subheading: '',
  ctaLabel: '',
  ctaHref: '',
  imageDesktop: '',
  imageMobile: '',
});

interface FormState {
  type: HomepageSectionType;
  title: string;
  isEnabled: boolean;
  heading: string;
  viewAllHref: string;
  source: 'collection' | 'category' | 'newest';
  collectionSlug: string;
  categorySlug: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  label: string;
  repeatedText: string;
  body: string;
  incentive: string;
  slides: HeroSlide[];
}

const emptyForm: FormState = {
  type: 'product_carousel',
  title: '',
  isEnabled: true,
  heading: '',
  viewAllHref: '',
  source: 'collection',
  collectionSlug: '',
  categorySlug: '',
  ctaLabel: '',
  ctaHref: '',
  image: '',
  label: '',
  repeatedText: '',
  body: '',
  incentive: '',
  slides: [],
};

function sectionToForm(section: HomepageSection): FormState {
  const c = section.config as Record<string, unknown>;
  return {
    ...emptyForm,
    type: section.type,
    title: section.title,
    isEnabled: section.isEnabled,
    heading: typeof c.heading === 'string' ? c.heading : '',
    viewAllHref: typeof c.viewAllHref === 'string' ? c.viewAllHref : '',
    source: (c.source as FormState['source']) ?? 'collection',
    collectionSlug: typeof c.collectionSlug === 'string' ? c.collectionSlug : '',
    categorySlug: typeof c.categorySlug === 'string' ? c.categorySlug : '',
    ctaLabel: typeof c.ctaLabel === 'string' ? c.ctaLabel : '',
    ctaHref: typeof c.ctaHref === 'string' ? c.ctaHref : '',
    image: typeof c.image === 'string' ? c.image : '',
    label: typeof c.label === 'string' ? c.label : '',
    repeatedText: typeof c.repeatedText === 'string' ? c.repeatedText : '',
    body: typeof c.body === 'string' ? c.body : '',
    incentive: typeof c.incentive === 'string' ? c.incentive : '',
    slides: Array.isArray(c.slides) ? (c.slides as HeroSlide[]) : [],
  };
}

function formToInput(form: FormState): HomepageSectionInput {
  let config: Record<string, unknown> = {};
  switch (form.type) {
    case 'hero':
      config = { slides: form.slides };
      break;
    case 'product_carousel':
      config = {
        heading: form.heading,
        viewAllHref: form.viewAllHref || undefined,
        source: form.source,
        collectionSlug: form.source === 'collection' ? form.collectionSlug : undefined,
        categorySlug: form.source === 'category' ? form.categorySlug : undefined,
      };
      break;
    case 'banner':
      config = { heading: form.heading, ctaLabel: form.ctaLabel, ctaHref: form.ctaHref, image: form.image };
      break;
    case 'editorial':
      config = { label: form.label, repeatedText: form.repeatedText, body: form.body };
      break;
    case 'category_grid':
      config = {};
      break;
    case 'newsletter':
      config = { heading: form.heading || undefined, incentive: form.incentive || undefined };
      break;
  }
  return { type: form.type, title: form.title, isEnabled: form.isEnabled, config };
}

export function AdminHomepage() {
  const { show } = useToast();
  const [sections, setSections] = useState<HomepageSection[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = () => homepageSectionService.listAll().then(setSections);

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (section: HomepageSection) => {
    setForm(sectionToForm(section));
    setEditingId(section.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const input = formToInput(form);
      if (editingId) await homepageSectionService.update(editingId, input);
      else await homepageSectionService.create(input);
      setShowForm(false);
      await load();
      show({ title: 'Section saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save section', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async (section: HomepageSection) => {
    setPendingId(section.id);
    try {
      await homepageSectionService.update(section.id, { isEnabled: !section.isEnabled });
      await load();
    } catch (err) {
      show({ title: 'Could not update section', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setPendingId(null);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!sections) return;
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    setSections(reordered);
    try {
      await homepageSectionService.reorder(reordered.map((s) => s.id));
    } catch (err) {
      show({ title: 'Could not reorder sections', description: err instanceof Error ? err.message : undefined, variant: 'error' });
      await load();
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await homepageSectionService.remove(deletingId);
      await load();
      show({ title: 'Section deleted', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not delete section', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    setForm((f) => ({ ...f, slides: f.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  };

  return (
    <div>
      <AdminPageHeader
        title="Homepage"
        description="Enable, disable, and reorder what renders on the storefront homepage."
        actions={
          <AdminButton onClick={startCreate}>
            <Plus className="h-4 w-4" /> Add section
          </AdminButton>
        }
      />

      {showForm ? (
        <AdminCard className="mb-6">
          <AdminCardHeader>
            <h2 className="text-sm font-semibold text-slate-900">{editingId ? 'Edit section' : 'New section'}</h2>
          </AdminCardHeader>
          <AdminCardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminInput
                  label="Admin label"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <AdminSelect
                  label="Type"
                  value={form.type}
                  disabled={!!editingId}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as HomepageSectionType }))}
                  options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </div>

              {form.type === 'product_carousel' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminInput label="Heading" required value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} />
                  <AdminInput
                    label="View all link (optional)"
                    value={form.viewAllHref}
                    onChange={(e) => setForm((f) => ({ ...f, viewAllHref: e.target.value }))}
                  />
                  <AdminSelect
                    label="Source"
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as FormState['source'] }))}
                    options={[
                      { value: 'collection', label: 'Collection' },
                      { value: 'category', label: 'Category' },
                      { value: 'newest', label: 'Newest products' },
                    ]}
                  />
                  {form.source === 'collection' ? (
                    <AdminInput
                      label="Collection slug"
                      required
                      value={form.collectionSlug}
                      onChange={(e) => setForm((f) => ({ ...f, collectionSlug: e.target.value }))}
                    />
                  ) : form.source === 'category' ? (
                    <AdminInput
                      label="Category slug"
                      required
                      value={form.categorySlug}
                      onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
                    />
                  ) : null}
                </div>
              ) : null}

              {form.type === 'banner' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminInput label="Heading" required value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} />
                  <AdminInput label="CTA label" required value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} />
                  <AdminInput label="CTA link" required value={form.ctaHref} onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} />
                  <AdminInput
                    label="Image URL"
                    required
                    containerClassName="sm:col-span-2"
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  />
                </div>
              ) : null}

              {form.type === 'editorial' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminInput label="Eyebrow label" required value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
                  <AdminInput
                    label="Repeated marquee text"
                    required
                    value={form.repeatedText}
                    onChange={(e) => setForm((f) => ({ ...f, repeatedText: e.target.value }))}
                  />
                  <AdminTextarea
                    label="Body"
                    required
                    containerClassName="sm:col-span-2"
                    rows={3}
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  />
                </div>
              ) : null}

              {form.type === 'newsletter' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminInput
                    label="Heading (optional)"
                    placeholder="Join the list"
                    value={form.heading}
                    onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
                  />
                  <AdminInput
                    label="Incentive text (optional)"
                    placeholder="Get 10% off your next order."
                    value={form.incentive}
                    onChange={(e) => setForm((f) => ({ ...f, incentive: e.target.value }))}
                  />
                </div>
              ) : null}

              {form.type === 'category_grid' ? <p className="text-sm text-slate-500">Pulls live from Categories — nothing to configure.</p> : null}

              {form.type === 'hero' ? (
                <div className="flex flex-col gap-4">
                  {form.slides.map((slide, index) => (
                    <AdminCard key={slide.id}>
                      <AdminCardBody className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slide {index + 1}</p>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, slides: f.slides.filter((_, i) => i !== index) }))}
                            aria-label="Remove slide"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <AdminInput label="Eyebrow" value={slide.eyebrow ?? ''} onChange={(e) => updateSlide(index, { eyebrow: e.target.value })} />
                          <AdminInput label="Heading" required value={slide.heading} onChange={(e) => updateSlide(index, { heading: e.target.value })} />
                          <AdminInput
                            label="Subheading"
                            containerClassName="sm:col-span-2"
                            value={slide.subheading ?? ''}
                            onChange={(e) => updateSlide(index, { subheading: e.target.value })}
                          />
                          <AdminInput label="CTA label" required value={slide.ctaLabel} onChange={(e) => updateSlide(index, { ctaLabel: e.target.value })} />
                          <AdminInput label="CTA link" required value={slide.ctaHref} onChange={(e) => updateSlide(index, { ctaHref: e.target.value })} />
                          <AdminInput
                            label="Desktop image URL"
                            required
                            value={slide.imageDesktop}
                            onChange={(e) => updateSlide(index, { imageDesktop: e.target.value })}
                          />
                          <AdminInput
                            label="Mobile image URL"
                            required
                            value={slide.imageMobile}
                            onChange={(e) => updateSlide(index, { imageMobile: e.target.value })}
                          />
                        </div>
                      </AdminCardBody>
                    </AdminCard>
                  ))}
                  <AdminButton
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => setForm((f) => ({ ...f, slides: [...f.slides, emptySlide()] }))}
                  >
                    <Plus className="h-4 w-4" /> Add slide
                  </AdminButton>
                </div>
              ) : null}

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))} />
                Enabled
              </label>

              <div className="flex gap-2">
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

      {sections === null ? (
        <AdminTableSkeleton />
      ) : sections.length === 0 ? (
        <AdminEmptyState title="No homepage sections yet" action={<AdminButton size="sm" onClick={startCreate}>Add section</AdminButton>} />
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((section, index) => (
            <AdminCard key={section.id}>
              <AdminCardBody className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === sections.length - 1}
                      onClick={() => handleMove(index, 1)}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                      <AdminBadge>{TYPE_LABELS[section.type]}</AdminBadge>
                      <AdminBadge variant={section.isEnabled ? 'success' : 'neutral'}>{section.isEnabled ? 'Enabled' : 'Disabled'}</AdminBadge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={section.isEnabled}
                      disabled={pendingId === section.id}
                      onChange={() => handleToggleEnabled(section)}
                    />
                    Enabled
                  </label>
                  <AdminButton size="sm" variant="outline" onClick={() => startEdit(section)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </AdminButton>
                  <button
                    type="button"
                    onClick={() => setDeletingId(section.id)}
                    aria-label="Delete section"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </AdminCardBody>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminConfirmDialog
        isOpen={deletingId !== null}
        title="Delete this section?"
        description="It will be removed from the homepage immediately."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
