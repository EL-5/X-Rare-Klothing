import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSearchInput } from '@/components/admin/ui/AdminSearchInput';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { useToast } from '@/stores/ToastStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { collectionService } from '@/services/collectionService';
import type { AssignedProduct } from '@/repositories/collectionRepository';
import type { Collection } from '@/types/domain';

export function AdminCollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();

  const [collection, setCollection] = useState<Collection | null | undefined>(undefined);
  const [assigned, setAssigned] = useState<AssignedProduct[] | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [candidates, setCandidates] = useState<{ id: string; title: string }[]>([]);

  const loadAssigned = async () => {
    if (!id) return;
    setAssigned(await collectionService.listAssignedProducts(id));
  };

  useEffect(() => {
    if (!id) return;
    collectionService.list().then((all) => setCollection(all.find((c) => c.id === id) ?? null));
    void loadAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    collectionService.listUnassignedProducts(id, debouncedSearch || undefined).then(setCandidates);
  }, [id, debouncedSearch, assigned]);

  const handleAssign = async (productId: string) => {
    if (!id) return;
    try {
      await collectionService.assignProduct(id, productId);
      await loadAssigned();
    } catch (err) {
      show({ title: 'Could not add product', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  };

  const handleUnassign = async (productId: string) => {
    if (!id) return;
    try {
      await collectionService.unassignProduct(id, productId);
      await loadAssigned();
    } catch (err) {
      show({ title: 'Could not remove product', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!id || !assigned) return;
    const target = index + direction;
    if (target < 0 || target >= assigned.length) return;
    const reordered = [...assigned];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    setAssigned(reordered);
    await collectionService.reorderProducts(id, reordered.map((p) => p.productId));
  };

  if (collection === undefined || assigned === null) {
    return <AdminSkeleton className="h-96 w-full" />;
  }

  if (collection === null) {
    return (
      <div>
        <AdminPageHeader title="Collection not found" />
        <AdminButton variant="outline" onClick={() => navigate('/admin/collections')}>
          Back to collections
        </AdminButton>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={collection.title} description="Assign and order the products shown in this collection." />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader>
            <h2 className="text-sm font-semibold text-slate-900">In this collection ({assigned.length})</h2>
          </AdminCardHeader>
          <AdminCardBody className="flex flex-col gap-2">
            {assigned.length === 0 ? (
              <p className="text-sm text-slate-500">No products assigned yet — add some from the right.</p>
            ) : (
              assigned.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-800">{product.title}</span>
                    {product.status !== 'active' ? <AdminBadge variant="neutral">{product.status}</AdminBadge> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move up" className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={index === assigned.length - 1} onClick={() => move(index, 1)} aria-label="Move down" className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => handleUnassign(product.productId)} aria-label="Remove from collection" className="text-red-500 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Add products</h2>
          </AdminCardHeader>
          <AdminCardBody className="flex flex-col gap-3">
            <AdminSearchInput value={search} onChange={setSearch} placeholder="Search products…" />
            {candidates.length === 0 ? (
              <p className="text-sm text-slate-500">No matching products.</p>
            ) : (
              candidates.map((product) => (
                <div key={product.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                  <span className="text-sm text-slate-800">{product.title}</span>
                  <button type="button" onClick={() => handleAssign(product.id)} aria-label="Add to collection" className="text-indigo-600 hover:text-indigo-700">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </AdminCardBody>
        </AdminCard>
      </div>
    </div>
  );
}
