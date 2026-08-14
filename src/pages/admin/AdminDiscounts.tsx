import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput, AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import { discountService } from '@/services/discountService';
import { productService } from '@/services/productService';
import { collectionService } from '@/services/collectionService';
import type { DiscountInput, DiscountWithCode } from '@/repositories/discountRepository';

type TargetMode = 'all' | 'products' | 'collections';

interface DiscountFormState {
  name: string;
  code: string;
  kind: DiscountInput['kind'];
  value: number;
  minSubtotalCents: string;
  maxDiscountCents: string;
  usageLimit: string;
  perCustomerLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  targetMode: TargetMode;
  productIds: string[];
  collectionIds: string[];
}

const emptyForm: DiscountFormState = {
  name: '',
  code: '',
  kind: 'percentage',
  value: 10,
  minSubtotalCents: '',
  maxDiscountCents: '',
  usageLimit: '',
  perCustomerLimit: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
  targetMode: 'all',
  productIds: [],
  collectionIds: [],
};

/** datetime-local <-> ISO — datetime-local has no timezone, so it's treated as local time on both ends. */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function discountToForm(discount: DiscountWithCode): DiscountFormState {
  const targetMode: TargetMode = 'productIds' in discount.appliesTo ? 'products' : 'collectionIds' in discount.appliesTo ? 'collections' : 'all';
  return {
    name: discount.name,
    code: discount.code,
    kind: discount.kind,
    value: discount.value,
    minSubtotalCents: discount.minSubtotalCents?.toString() ?? '',
    maxDiscountCents: discount.maxDiscountCents?.toString() ?? '',
    usageLimit: discount.usageLimit?.toString() ?? '',
    perCustomerLimit: discount.perCustomerLimit?.toString() ?? '',
    startsAt: isoToLocalInput(discount.startsAt),
    endsAt: isoToLocalInput(discount.endsAt),
    isActive: discount.isActive,
    targetMode,
    productIds: 'productIds' in discount.appliesTo ? discount.appliesTo.productIds : [],
    collectionIds: 'collectionIds' in discount.appliesTo ? discount.appliesTo.collectionIds : [],
  };
}

function formToInput(form: DiscountFormState): DiscountInput {
  return {
    name: form.name,
    code: form.code,
    kind: form.kind,
    value: form.value,
    minSubtotalCents: form.minSubtotalCents === '' ? null : Number(form.minSubtotalCents),
    maxDiscountCents: form.maxDiscountCents === '' ? null : Number(form.maxDiscountCents),
    usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
    perCustomerLimit: form.perCustomerLimit === '' ? null : Number(form.perCustomerLimit),
    startsAt: form.startsAt === '' ? null : new Date(form.startsAt).toISOString(),
    endsAt: form.endsAt === '' ? null : new Date(form.endsAt).toISOString(),
    isActive: form.isActive,
    appliesTo:
      form.targetMode === 'products'
        ? { productIds: form.productIds }
        : form.targetMode === 'collections'
          ? { collectionIds: form.collectionIds }
          : { all: true },
  };
}

export function AdminDiscounts() {
  const { show } = useToast();
  const [discounts, setDiscounts] = useState<DiscountWithCode[] | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [collections, setCollections] = useState<{ id: string; title: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => discountService.listForAdmin().then(setDiscounts);

  useEffect(() => {
    void load();
    productService.listNamesForAdmin().then(setProducts);
    collectionService.list().then((cols) => setCollections(cols.map((c) => ({ id: c.id, title: c.title }))));
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (discount: DiscountWithCode) => {
    setForm(discountToForm(discount));
    setEditingId(discount.id);
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const input = formToInput(form);
      if (editingId) {
        await discountService.update(editingId, input);
      } else {
        await discountService.create(input);
      }
      setShowForm(false);
      await load();
      show({ title: 'Discount saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save discount', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await discountService.remove(deletingId);
      await load();
      show({ title: 'Discount deleted', variant: 'success' });
    } catch (err) {
      show({
        title: 'Could not delete discount',
        description: err instanceof Error ? err.message : 'It may have been used on past orders — deactivate it instead.',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const toggleTargetId = (list: 'productIds' | 'collectionIds', id: string) => {
    setForm((f) => ({
      ...f,
      [list]: f[list].includes(id) ? f[list].filter((x) => x !== id) : [...f[list], id],
    }));
  };

  return (
    <div>
      <AdminPageHeader
        title="Discounts"
        actions={
          <AdminButton onClick={startCreate}>
            <Plus className="h-4 w-4" /> New discount
          </AdminButton>
        }
      />

      {showForm ? (
        <AdminCard className="mb-6">
          <AdminCardBody>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <AdminInput label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <AdminInput
                label="Code"
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
              <AdminSelect
                label="Type"
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as DiscountInput['kind'] }))}
                options={[
                  { value: 'percentage', label: 'Percentage off' },
                  { value: 'fixed_amount', label: 'Fixed amount off (cents)' },
                  { value: 'free_shipping', label: 'Free shipping' },
                ]}
              />
              <AdminInput
                label={form.kind === 'percentage' ? 'Percent off' : 'Value (cents)'}
                type="number"
                required
                disabled={form.kind === 'free_shipping'}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
              />

              <AdminInput
                label="Minimum order (cents)"
                type="number"
                min="0"
                placeholder="No minimum"
                value={form.minSubtotalCents}
                onChange={(e) => setForm((f) => ({ ...f, minSubtotalCents: e.target.value }))}
              />
              <AdminInput
                label="Maximum discount (cents)"
                type="number"
                min="0"
                placeholder="No cap"
                disabled={form.kind === 'free_shipping'}
                value={form.maxDiscountCents}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscountCents: e.target.value }))}
              />
              <AdminInput
                label="Usage limit (total)"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
              />
              <AdminInput
                label="Per-customer limit"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.perCustomerLimit}
                onChange={(e) => setForm((f) => ({ ...f, perCustomerLimit: e.target.value }))}
              />

              <AdminInput
                label="Starts at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
              <AdminInput
                label="Ends at"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              />

              <div className="flex flex-col gap-2 sm:col-span-2">
                <AdminSelect
                  label="Applies to"
                  value={form.targetMode}
                  onChange={(e) => setForm((f) => ({ ...f, targetMode: e.target.value as TargetMode }))}
                  options={[
                    { value: 'all', label: 'All products' },
                    { value: 'products', label: 'Specific products' },
                    { value: 'collections', label: 'Specific collections' },
                  ]}
                />

                {form.targetMode === 'products' ? (
                  <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-md border border-slate-200 p-3">
                    {products.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleTargetId('productIds', p.id)} />
                        {p.name}
                      </label>
                    ))}
                  </div>
                ) : null}

                {form.targetMode === 'collections' ? (
                  <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-md border border-slate-200 p-3">
                    {collections.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.collectionIds.includes(c.id)}
                          onChange={() => toggleTargetId('collectionIds', c.id)}
                        />
                        {c.title}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Active
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

      {discounts === null ? (
        <AdminTableSkeleton />
      ) : discounts.length === 0 ? (
        <AdminEmptyState title="No discounts yet" action={<AdminButton size="sm" onClick={startCreate}>New discount</AdminButton>} />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>Name</AdminTh>
                <AdminTh>Code</AdminTh>
                <AdminTh>Type</AdminTh>
                <AdminTh>Value</AdminTh>
                <AdminTh>Usage</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh />
              </tr>
            </AdminTHead>
            <AdminTBody>
              {discounts.map((discount) => (
                <AdminTr key={discount.id}>
                  <AdminTd>
                    <button type="button" onClick={() => startEdit(discount)} className="font-medium text-slate-900 hover:text-indigo-600">
                      {discount.name}
                    </button>
                  </AdminTd>
                  <AdminTd className="font-mono text-xs text-slate-600">{discount.code}</AdminTd>
                  <AdminTd className="capitalize text-slate-500">{discount.kind.replace('_', ' ')}</AdminTd>
                  <AdminTd>{discount.kind === 'percentage' ? `${discount.value}%` : discount.kind === 'fixed_amount' ? `$${(discount.value / 100).toFixed(2)}` : '—'}</AdminTd>
                  <AdminTd className="text-slate-500">{discount.usageCount}{discount.usageLimit ? ` / ${discount.usageLimit}` : ''}</AdminTd>
                  <AdminTd>
                    <AdminBadge variant={discount.isActive ? 'success' : 'neutral'}>{discount.isActive ? 'Active' : 'Inactive'}</AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <button type="button" onClick={() => setDeletingId(discount.id)} aria-label="Delete discount" className="text-red-500 hover:text-red-700">
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
        title="Delete this discount?"
        description="Its code will stop working immediately."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
