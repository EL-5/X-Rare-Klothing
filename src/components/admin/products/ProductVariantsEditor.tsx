import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import { productService } from '@/services/productService';
import type { Product, ProductVariant } from '@/types/domain';
import type { VariantFormInput } from '@/repositories/productRepository';

const emptyDraft: VariantFormInput = {
  sku: '',
  priceCents: 0,
  compareAtPriceCents: null,
  costCents: null,
  barcode: '',
  weightGrams: null,
  size: '',
  color: '',
  material: '',
  isActive: true,
};

function centsToInput(cents: number | null | undefined): string {
  return cents ? (cents / 100).toFixed(2) : '';
}

function inputToCents(value: string): number | null {
  return value ? Math.round(parseFloat(value) * 100) : null;
}

export function ProductVariantsEditor({ product, onChange }: { product: Product; onChange: (product: Product) => void }) {
  const { show } = useToast();
  const [draft, setDraft] = useState<VariantFormInput>(emptyDraft);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [edits, setEdits] = useState<Record<string, Partial<VariantFormInput>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateVariantLocally = (updated: ProductVariant) => {
    onChange({ ...product, variants: product.variants.map((v) => (v.id === updated.id ? updated : v)) });
  };

  const handleFieldChange = (variantId: string, patch: Partial<VariantFormInput>) => {
    setEdits((prev) => ({ ...prev, [variantId]: { ...prev[variantId], ...patch } }));
  };

  const handleSaveVariant = async (variant: ProductVariant) => {
    const patch = edits[variant.id];
    if (!patch) return;
    setSavingId(variant.id);
    try {
      const updated = await productService.updateVariant(variant.id, patch);
      updateVariantLocally(updated);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[variant.id];
        return next;
      });
      show({ title: 'Variant saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save variant', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const handleAddVariant = async () => {
    if (!draft.sku || draft.priceCents <= 0) {
      show({ title: 'SKU and a price greater than $0 are required', variant: 'error' });
      return;
    }
    setIsAdding(true);
    try {
      const created = await productService.createVariant(product.id, draft);
      onChange({ ...product, variants: [...product.variants, created] });
      setDraft(emptyDraft);
      show({ title: 'Variant added', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not add variant', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteVariant = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await productService.removeVariant(deletingId);
      onChange({ ...product, variants: product.variants.filter((v) => v.id !== deletingId) });
      show({ title: 'Variant removed', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not remove variant', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  return (
    <AdminCard>
      <AdminCardHeader className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Variants</h2>
        <Link to="/admin/inventory" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          Manage stock in Inventory →
        </Link>
      </AdminCardHeader>
      <AdminCardBody className="p-0">
        <AdminTable>
          <AdminTHead>
            <tr>
              <AdminTh>SKU</AdminTh>
              <AdminTh>Price</AdminTh>
              <AdminTh>Compare-at</AdminTh>
              <AdminTh>Cost</AdminTh>
              <AdminTh>Barcode</AdminTh>
              <AdminTh>Weight (g)</AdminTh>
              <AdminTh>Size</AdminTh>
              <AdminTh>Color</AdminTh>
              <AdminTh>Material</AdminTh>
              <AdminTh />
            </tr>
          </AdminTHead>
          <AdminTBody>
            {product.variants.map((variant) => {
              const patch = edits[variant.id];
              return (
                <AdminTr key={variant.id}>
                  <AdminTd className="min-w-[140px]">
                    <AdminInput defaultValue={variant.sku} onChange={(e) => handleFieldChange(variant.id, { sku: e.target.value })} />
                  </AdminTd>
                  <AdminTd className="min-w-[100px]">
                    <AdminInput
                      type="number"
                      step="0.01"
                      defaultValue={centsToInput(variant.price.cents)}
                      onChange={(e) => handleFieldChange(variant.id, { priceCents: inputToCents(e.target.value) ?? 0 })}
                    />
                  </AdminTd>
                  <AdminTd className="min-w-[100px]">
                    <AdminInput
                      type="number"
                      step="0.01"
                      defaultValue={centsToInput(variant.compareAtPrice?.cents)}
                      onChange={(e) => handleFieldChange(variant.id, { compareAtPriceCents: inputToCents(e.target.value) })}
                    />
                  </AdminTd>
                  <AdminTd className="min-w-[100px]">
                    <AdminInput
                      type="number"
                      step="0.01"
                      onChange={(e) => handleFieldChange(variant.id, { costCents: inputToCents(e.target.value) })}
                    />
                  </AdminTd>
                  <AdminTd className="min-w-[120px]">
                    <AdminInput onChange={(e) => handleFieldChange(variant.id, { barcode: e.target.value })} />
                  </AdminTd>
                  <AdminTd className="min-w-[90px]">
                    <AdminInput type="number" step="1" onChange={(e) => handleFieldChange(variant.id, { weightGrams: e.target.value ? Number(e.target.value) : null })} />
                  </AdminTd>
                  <AdminTd className="min-w-[80px]">
                    <AdminInput defaultValue={variant.size ?? ''} onChange={(e) => handleFieldChange(variant.id, { size: e.target.value })} />
                  </AdminTd>
                  <AdminTd className="min-w-[100px]">
                    <AdminInput defaultValue={variant.color ?? ''} onChange={(e) => handleFieldChange(variant.id, { color: e.target.value })} />
                  </AdminTd>
                  <AdminTd className="min-w-[100px]">
                    <AdminInput defaultValue={variant.material ?? ''} onChange={(e) => handleFieldChange(variant.id, { material: e.target.value })} />
                  </AdminTd>
                  <AdminTd>
                    <div className="flex gap-2">
                      <AdminButton
                        size="sm"
                        variant="outline"
                        disabled={!patch}
                        isLoading={savingId === variant.id}
                        onClick={() => handleSaveVariant(variant)}
                      >
                        Save
                      </AdminButton>
                      <button
                        type="button"
                        onClick={() => setDeletingId(variant.id)}
                        aria-label="Delete variant"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </AdminTd>
                </AdminTr>
              );
            })}

            <AdminTr>
              <AdminTd>
                <AdminInput placeholder="New SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
              </AdminTd>
              <AdminTd>
                <AdminInput
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={draft.priceCents ? centsToInput(draft.priceCents) : ''}
                  onChange={(e) => setDraft({ ...draft, priceCents: inputToCents(e.target.value) ?? 0 })}
                />
              </AdminTd>
              <AdminTd>
                <AdminInput type="number" step="0.01" placeholder="0.00" onChange={(e) => setDraft({ ...draft, compareAtPriceCents: inputToCents(e.target.value) })} />
              </AdminTd>
              <AdminTd>
                <AdminInput type="number" step="0.01" placeholder="0.00" onChange={(e) => setDraft({ ...draft, costCents: inputToCents(e.target.value) })} />
              </AdminTd>
              <AdminTd>
                <AdminInput placeholder="Barcode" onChange={(e) => setDraft({ ...draft, barcode: e.target.value })} />
              </AdminTd>
              <AdminTd>
                <AdminInput type="number" step="1" placeholder="0" onChange={(e) => setDraft({ ...draft, weightGrams: e.target.value ? Number(e.target.value) : null })} />
              </AdminTd>
              <AdminTd>
                <AdminInput placeholder="Size" value={draft.size ?? ''} onChange={(e) => setDraft({ ...draft, size: e.target.value })} />
              </AdminTd>
              <AdminTd>
                <AdminInput placeholder="Color" value={draft.color ?? ''} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
              </AdminTd>
              <AdminTd>
                <AdminInput placeholder="Material" value={draft.material ?? ''} onChange={(e) => setDraft({ ...draft, material: e.target.value })} />
              </AdminTd>
              <AdminTd>
                <AdminButton size="sm" isLoading={isAdding} onClick={handleAddVariant}>
                  <Plus className="h-4 w-4" /> Add
                </AdminButton>
              </AdminTd>
            </AdminTr>
          </AdminTBody>
        </AdminTable>
      </AdminCardBody>

      <AdminConfirmDialog
        isOpen={deletingId !== null}
        title="Delete this variant?"
        description="This can't be undone."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDeleteVariant}
        onCancel={() => setDeletingId(null)}
      />
    </AdminCard>
  );
}
