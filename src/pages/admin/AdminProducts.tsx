import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchInput } from '@/components/admin/ui/AdminSearchInput';
import { AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminBadge, type AdminBadgeVariant } from '@/components/admin/ui/AdminBadge';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { productService } from '@/services/productService';
import { formatMoney } from '@/utils/money';
import type { Product } from '@/types/domain';
import type { ProductStatus } from '@/types/database';

const STATUS_VARIANT: Record<ProductStatus, AdminBadgeVariant> = {
  active: 'success',
  draft: 'neutral',
  archived: 'warning',
};

const PAGE_SIZE = 20;

export function AdminProducts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setError(null);
    productService
      .listForAdmin({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined, status: status || undefined })
      .then((result) => {
        if (cancelled) return;
        setProducts(result.items);
        setTotal(result.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products.');
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status]);

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage your catalog."
        actions={
          <AdminButton onClick={() => navigate('/admin/products/new')}>
            <Plus className="h-4 w-4" /> New product
          </AdminButton>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name or SKU…" className="w-72" />
        <AdminSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as ProductStatus | '')}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
          className="w-40"
        />
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={() => setPage((p) => p)} />
      ) : products === null ? (
        <AdminTableSkeleton />
      ) : products.length === 0 ? (
        <AdminEmptyState
          title="No products found"
          description={debouncedSearch || status ? 'Try a different search or filter.' : 'Create your first product to get started.'}
          action={
            !debouncedSearch && !status ? (
              <AdminButton size="sm" onClick={() => navigate('/admin/products/new')}>
                New product
              </AdminButton>
            ) : undefined
          }
        />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>Name</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Variants</AdminTh>
                <AdminTh>From</AdminTh>
              </tr>
            </AdminTHead>
            <AdminTBody>
              {products.map((product, index) => (
                <AdminTr key={product.id} index={index} className="cursor-pointer" onClick={() => navigate(`/admin/products/${product.id}`)}>
                  <AdminTd>
                    <Link to={`/admin/products/${product.id}`} className="font-medium text-slate-900 hover:text-indigo-600" onClick={(e) => e.stopPropagation()}>
                      {product.title}
                    </Link>
                  </AdminTd>
                  <AdminTd>
                    <AdminBadge variant={STATUS_VARIANT[product.status]}>{product.status}</AdminBadge>
                  </AdminTd>
                  <AdminTd>{product.variants.length}</AdminTd>
                  <AdminTd>{formatMoney(product.price)}</AdminTd>
                </AdminTr>
              ))}
            </AdminTBody>
          </AdminTable>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </AdminTableCard>
      )}
    </div>
  );
}
