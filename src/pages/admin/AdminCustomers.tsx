import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchInput } from '@/components/admin/ui/AdminSearchInput';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { customerService } from '@/services/customerService';
import type { Customer } from '@/types/domain';

const PAGE_SIZE = 20;

export function AdminCustomers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setCustomers(null);
    setError(null);
    customerService
      .listForAdmin({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined })
      .then((result) => {
        if (cancelled) return;
        setCustomers(result.items);
        setTotal(result.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load customers.');
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch]);

  return (
    <div>
      <AdminPageHeader title="Customers" description="For support use — view a shopper's profile to help with an order." />

      <div className="mb-4">
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" className="w-80" />
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={() => setPage((p) => p)} />
      ) : customers === null ? (
        <AdminTableSkeleton />
      ) : customers.length === 0 ? (
        <AdminEmptyState title="No customers found" />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>Name</AdminTh>
                <AdminTh>Email</AdminTh>
                <AdminTh>Phone</AdminTh>
              </tr>
            </AdminTHead>
            <AdminTBody>
              {customers.map((customer) => (
                <AdminTr key={customer.id} className="cursor-pointer" onClick={() => navigate(`/admin/customers/${customer.id}`)}>
                  <AdminTd>
                    <Link to={`/admin/customers/${customer.id}`} className="font-medium text-slate-900 hover:text-indigo-600" onClick={(e) => e.stopPropagation()}>
                      {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—'}
                    </Link>
                  </AdminTd>
                  <AdminTd className="text-slate-500">{customer.email}</AdminTd>
                  <AdminTd className="text-slate-500">{customer.phone ?? '—'}</AdminTd>
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
