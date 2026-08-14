import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/stores/AuthStore';
import { ROUTES } from '@/config/routes';

/** Keeps signed-in shoppers off /login, /register, etc. */
export function RequireGuest() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={ROUTES.account} replace />;

  return <Outlet />;
}
