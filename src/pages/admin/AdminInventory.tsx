import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchInput } from '@/components/admin/ui/AdminSearchInput';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { InventoryAdjustDialog, type AdjustType } from '@/components/admin/products/InventoryAdjustDialog';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/stores/ToastStore';
import { inventoryService } from '@/services/inventoryService';
import { cn } from '@/lib/cn';
import type { InventoryLevelWithVariant } from '@/repositories/inventoryRepository';

const PAGE_SIZE = 20;

type StockFilter = 'all' | 'low' | 'out';

export function AdminInventory() {
  const { show } = useToast();
  const [rows, setRows] = useState<InventoryLevelWithVariant[] | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [page, setPage] = useState(1);
  const [adjustingRow, setAdjustingRow] = useState<InventoryLevelWithVariant | null>(null);

  const load = async () => {
    setRows(await inventoryService.listAllForAdmin());
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stockFilter]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = debouncedSearch.trim().toLowerCase();
    return rows
      .filter((r) => !q || r.productName.toLowerCase().includes(q) || r.variantSku.toLowerCase().includes(q))
      .filter((r) => {
        if (stockFilter === 'low') return r.available > 0 && r.available <= r.lowStockThreshold;
        if (stockFilter === 'out') return r.available <= 0;
        return true;
      });
  }, [rows, debouncedSearch, stockFilter]);

  const pageRows = filtered?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? null;

  const handleAdjustSubmit = async (type: AdjustType, quantity: number, reason: string) => {
    if (!adjustingRow) return;
    try {
      if (type === 'restock') await inventoryService.restock(adjustingRow.variantId, quantity, reason || undefined);
      else if (type === 'return') await inventoryService.recordReturn(adjustingRow.variantId, quantity, reason || undefined);
      else await inventoryService.adjustOnHand(adjustingRow.variantId, quantity, reason || undefined);
      await load();
      show({ title: 'Inventory movement recorded', variant: 'success' });
      setAdjustingRow(null);
    } catch (err) {
      show({ title: 'Could not record movement', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  };

  const counts = rows
    ? { low: rows.filter((r) => r.available > 0 && r.available <= r.lowStockThreshold).length, out: rows.filter((r) => r.available <= 0).length }
    : { low: 0, out: 0 };

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Every write here goes through inventory_movements, never a direct update — the ledger stays the source of truth."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by product or SKU…" className="w-72" />
        <div className="flex rounded-md border border-slate-300 bg-white p-0.5">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'low', label: `Low stock (${counts.low})` },
              { value: 'out', label: `Out of stock (${counts.out})` },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStockFilter(option.value)}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                stockFilter === option.value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {rows === null ? (
        <AdminTableSkeleton />
      ) : filtered && filtered.length === 0 ? (
        <AdminEmptyState title="No matching variants" />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>Product</AdminTh>
                <AdminTh>SKU</AdminTh>
                <AdminTh>On hand</AdminTh>
                <AdminTh>Reserved</AdminTh>
                <AdminTh>Available</AdminTh>
                <AdminTh>Sold</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh />
              </tr>
            </AdminTHead>
            <AdminTBody>
              {pageRows?.map((row) => (
                <AdminTr key={row.variantId}>
                  <AdminTd className="font-medium text-slate-900">{row.productName}</AdminTd>
                  <AdminTd className="text-slate-500">{row.variantSku}</AdminTd>
                  <AdminTd>{row.onHand}</AdminTd>
                  <AdminTd>{row.reserved}</AdminTd>
                  <AdminTd className="font-medium text-slate-900">{row.available}</AdminTd>
                  <AdminTd className="text-slate-500">{row.sold}</AdminTd>
                  <AdminTd>
                    {row.available <= 0 ? (
                      <AdminBadge variant="danger">Out of stock</AdminBadge>
                    ) : row.available <= row.lowStockThreshold ? (
                      <AdminBadge variant="warning">Low stock</AdminBadge>
                    ) : (
                      <AdminBadge variant="success">In stock</AdminBadge>
                    )}
                  </AdminTd>
                  <AdminTd>
                    <AdminButton variant="outline" size="sm" onClick={() => setAdjustingRow(row)}>
                      Adjust
                    </AdminButton>
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTBody>
          </AdminTable>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={filtered?.length ?? 0} onPageChange={setPage} />
        </AdminTableCard>
      )}

      <InventoryAdjustDialog
        isOpen={adjustingRow !== null}
        productName={adjustingRow?.productName ?? ''}
        variantSku={adjustingRow?.variantSku ?? ''}
        onSubmit={handleAdjustSubmit}
        onCancel={() => setAdjustingRow(null)}
      />
    </div>
  );
}
