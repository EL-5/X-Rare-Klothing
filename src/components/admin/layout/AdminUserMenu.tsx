import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Store } from 'lucide-react';
import { useAuth } from '@/stores/AuthStore';
import { customerService } from '@/services/customerService';
import { useDisclosure } from '@/hooks/useDisclosure';
import { ROUTES } from '@/config/routes';

export function AdminUserMenu() {
  const { profile, roles } = useAuth();
  const { isOpen, toggle, close } = useDisclosure();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await customerService.signOut();
      navigate(ROUTES.home, { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  const initials = (profile?.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-slate-700 sm:inline">{profile?.email}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">{profile?.email}</p>
              <p className="mt-0.5 text-xs capitalize text-slate-500">{roles.join(', ') || 'Staff'}</p>
            </div>
            <div className="border-t border-slate-100" />
            <a
              href={ROUTES.home}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              View storefront
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
