import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { roleRepository, type UserRoleAssignment } from '@/repositories/roleRepository';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTableCard, AdminTHead, AdminTh, AdminTBody, AdminTr, AdminTd } from '@/components/admin/ui/AdminTable';
import { AdminInput, AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { useToast } from '@/stores/ToastStore';
import type { AdminRole } from '@/types/domain';

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'order_manager', label: 'Order Manager' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'customer_support', label: 'Customer Support' },
];

export function AdminUsers() {
  const { show } = useToast();
  const [assignments, setAssignments] = useState<UserRoleAssignment[] | null>(null);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<AdminRole>('customer_support');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const load = async () => {
    setAssignments(await roleRepository.listAll());
  };

  useEffect(() => {
    void load();
  }, []);

  const handleGrant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await roleRepository.grant(userId, role);
      setUserId('');
      await load();
      show({ title: 'Role granted', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not grant role', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokingId) return;
    setIsRevoking(true);
    try {
      await roleRepository.revoke(revokingId);
      await load();
      show({ title: 'Role revoked', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not revoke role', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsRevoking(false);
      setRevokingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Admins"
        description="Granting/revoking roles is restricted to super_admin at the RLS layer (user_roles INSERT/UPDATE/DELETE policies), not just this route."
      />

      <AdminCard className="mb-6 max-w-2xl">
        <AdminCardBody>
          <form onSubmit={handleGrant} className="flex flex-wrap items-end gap-3">
            <AdminInput
              containerClassName="min-w-[260px] flex-1"
              label="User ID (auth.users.id)"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <AdminSelect label="Role" options={ROLE_OPTIONS} value={role} onChange={(e) => setRole(e.target.value as AdminRole)} />
            <AdminButton type="submit" isLoading={isSubmitting}>
              <UserPlus className="h-4 w-4" /> Grant
            </AdminButton>
          </form>
        </AdminCardBody>
      </AdminCard>

      {assignments === null ? (
        <AdminTableSkeleton />
      ) : (
        <AdminTableCard>
          <AdminTable>
            <AdminTHead>
              <tr>
                <AdminTh>User ID</AdminTh>
                <AdminTh>Role</AdminTh>
                <AdminTh>Granted</AdminTh>
                <AdminTh />
              </tr>
            </AdminTHead>
            <AdminTBody>
              {assignments.map((assignment, index) => (
                <AdminTr key={assignment.id} index={index}>
                  <AdminTd className="font-mono text-xs">{assignment.userId}</AdminTd>
                  <AdminTd className="capitalize">{assignment.role.replace('_', ' ')}</AdminTd>
                  <AdminTd className="text-slate-500">{new Date(assignment.createdAt).toLocaleDateString()}</AdminTd>
                  <AdminTd>
                    <button type="button" onClick={() => setRevokingId(assignment.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                      Revoke
                    </button>
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTBody>
          </AdminTable>
        </AdminTableCard>
      )}

      <AdminConfirmDialog
        isOpen={revokingId !== null}
        title="Revoke this role?"
        description="The user will immediately lose the access this role granted."
        confirmLabel="Revoke"
        isConfirming={isRevoking}
        onConfirm={handleRevoke}
        onCancel={() => setRevokingId(null)}
      />
    </div>
  );
}
