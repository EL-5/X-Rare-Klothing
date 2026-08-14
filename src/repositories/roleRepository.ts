import { supabase } from '@/lib/supabase';
import type { AdminRole } from '@/types/domain';

export interface UserRoleAssignment {
  id: string;
  userId: string;
  role: AdminRole;
  createdAt: string;
}

/**
 * Reads the current session's own admin roles (RLS: "Users can read own
 * roles" — `user_id = auth.uid()`). This is purely for client-side
 * UI/route-gating convenience; it is never the security boundary — see
 * docs/authorization.md.
 */
export const roleRepository = {
  async getMyRoles(): Promise<AdminRole[]> {
    const { data, error } = await supabase.from('user_roles').select('role');
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
