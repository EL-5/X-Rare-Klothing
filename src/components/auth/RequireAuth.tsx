import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/AuthStore';
import { ROUTES } from '@/config/routes';

/**
 * Client-side gate for customer account routes. This is a UX convenience
 * (avoid flashing account UI before redirecting) — the actual enforcement
 * is Postgres RLS on every table these pages read (see
 * docs/authorization.md). Never assume a route being reachable means the
 * data underneath it is accessible; the database checks that independently
 * on every query.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="mx-auto max-w-[var(--container-max)] px-6 py-24 text-center text-sm text-ink/60">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
