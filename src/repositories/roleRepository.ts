import { supabase } from '@/lib/supabase';
import type { AdminRole } from '@/types/domain';

export interface UserRoleAssignment {
  id: string;
  userId: string;
  role: AdminRole;
  createdAt: string;
}

/**
 * Reads the current session's own admin roles. This is purely for
 * client-side UI/route-gating convenience; it is never the security
 * boundary — see docs/authorization.md.
 *
 * Must filter by `user_id` explicitly rather than relying on RLS alone:
 * the effective SELECT policy on `user_roles` is "own row OR staff" (any
 * staff member can read the full roster, which the admin user-management
 * page needs), so an unfiltered query from a staff account returns every
 * role ever assigned to every staff account, not just the caller's own —
 * confirmed live during Batch 22 QA (an inventory_manager-only test
 * account was seeing content_manager/order_manager/customer_support nav
 * items and passing hasAnyRole() checks for roles it didn't have).
 */
export const roleRepository = {
  async getMyRoles(): Promise<AdminRole[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    if (error) throw error;
    return (data ?? []).map((row) => row.role);
  },

  /** super_admin-only in practice: RLS's "Users can read own roles" policy also allows any staff to read the full roster, but only super_admin can write it. */
  async listAll(): Promise<UserRoleAssignment[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, userId: row.user_id, role: row.role, createdAt: row.created_at }));
  },

  async grant(userId: string, role: AdminRole): Promise<void> {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) throw error;
  },

  async revoke(id: string): Promise<void> {
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) throw error;
  },
};
