import { useEffect, useState } from 'react';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { useToast } from '@/stores/ToastStore';
import { collectionService } from '@/services/collectionService';
import type { Collection } from '@/types/domain';

export function ProductCollectionsPicker({ productId }: { productId: string }) {
  const { show } = useToast();
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [memberIds, setMemberIds] = useState<Set<string> | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    collectionService.list().then(async (all) => {
      setCollections(all);
      const membership = new Set<string>();
      await Promise.all(
        all.map(async (collection) => {
          const assigned = await collectionService.listAssignedProducts(collection.id);
          if (assigned.some((a) => a.productId === productId)) membership.add(collection.id);
        }),
      );
      setMemberIds(membership);
    });
  }, [productId]);

  const toggle = async (collectionId: string, isMember: boolean) => {
    setPendingId(collectionId);
    try {
      if (isMember) {
        await collectionService.unassignProduct(collectionId, productId);
      } else {
        await collectionService.assignProduct(collectionId, productId);
      }
      setMemberIds((prev) => {
        const next = new Set(prev);
        if (isMember) next.delete(collectionId);
        else next.add(collectionId);
        return next;
      });
    } catch (err) {
      show({ title: 'Could not update collection', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <AdminCard>
      <AdminCardHeader>
        <h2 className="text-sm font-semibold text-slate-900">Collections</h2>
      </AdminCardHeader>
      <AdminCardBody className="flex flex-col gap-2">
        {collections === null || memberIds === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : collections.length === 0 ? (
          <p className="text-sm text-slate-500">No collections yet.</p>
        ) : (
          collections.map((collection) => {
            const isMember = memberIds.has(collection.id);
            return (
              <label key={collection.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isMember}
                  disabled={pendingId === collection.id}
                  onChange={() => toggle(collection.id, isMember)}
                />
                {collection.title}
                {!collection.isPublished ? <span className="text-xs text-slate-400">(unpublished)</span> : null}
              </label>
            );
          })
        )}
      </AdminCardBody>
    </AdminCard>
  );
}
