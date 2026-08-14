import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/stores/AuthStore';
import { ROUTES } from '@/config/routes';
import type { AdminRole } from '@/types/domain';

export interface RequireStaffRoleProps {
  /** Omit to allow any staff role; pass specific roles to narrow further. */
  roles?: AdminRole[];
}

/**
 * Client-side gate for the admin area. Exactly like RequireAuth, this is
 * UX only — "never trust frontend roles" (see docs/authorization.md). Every
 * admin table read/write is independently enforced by RLS policies keyed
 * off `has_role`/`has_any_role`, so even if this component were bypassed or
 * had a bug, the database still refuses unauthorized reads/writes.
 */
export function RequireStaffRole({ roles }: RequireStaffRoleProps) {
  const { isAuthenticated, isLoading, isStaff, hasAnyRole } = useAuth();

  if (isLoading) {
    return <div className="mx-auto max-w-[var(--container-max)] px-6 py-24 text-center text-sm text-ink/60">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const authorized = roles && roles.length > 0 ? hasAnyRole(...roles) : isStaff;
  if (!authorized) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
