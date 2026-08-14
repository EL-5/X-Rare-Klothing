import { supabase } from '@/lib/supabase';
import type { Customer, Paginated } from '@/types/domain';
import { mapCustomer } from './mappers';

export interface AdminListCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * `profiles` rows are created automatically by the `handle_new_user()`
 * trigger the moment someone signs up (see supabase/migrations/0002) — there
 * is no client-side "create profile" step, unlike Batch 1's placeholder.
 */
export const customerRepository = {
  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapCustomer(data) : null;
  },

  /** Staff-only in practice: RLS only grants customer_support+ roles a policy-free SELECT across all profiles. */
  async listAll(limit = 50): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapCustomer);
  },

  async listForAdmin(params: AdminListCustomersParams = {}): Promise<Paginated<Customer>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (params.search) {
      const safeQuery = params.search.replace(/[,()]/g, ' ').trim();
      if (safeQuery) query = query.or(`email.ilike.%${safeQuery}%,first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const items = (data ?? []).map(mapCustomer);
    const total = count ?? items.length;
    return { items, total, page, pageSize, hasMore: from + items.length < total };
  },

  async update(
    id: string,
    patch: Partial<{ firstName: string; lastName: string; phone: string; acceptsMarketing: boolean }>,
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...(patch.firstName !== undefined ? { first_name: patch.firstName } : {}),
        ...(patch.lastName !== undefined ? { last_name: patch.lastName } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.acceptsMarketing !== undefined ? { accepts_marketing: patch.acceptsMarketing } : {}),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapCustomer(data);
  },
};
