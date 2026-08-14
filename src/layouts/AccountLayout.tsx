import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/config/routes';
import { PageLoader } from '@/components/ui/PageLoader';
import { useDocumentHead } from '@/hooks/useDocumentHead';

const navItems = [
  { label: 'Overview', href: ROUTES.account, end: true },
  { label: 'Profile', href: ROUTES.accountProfile },
  { label: 'Orders', href: ROUTES.accountOrders },
  { label: 'Addresses', href: ROUTES.accountAddresses },
  { label: 'Wishlist', href: ROUTES.accountWishlist },
  { label: 'Settings', href: ROUTES.accountSettings },
];

export function AccountLayout() {
  useDocumentHead({ title: 'Account', path: ROUTES.account, noindex: true });

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-6 py-12 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Account" className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap px-3 py-2 text-sm font-medium uppercase tracking-wide transition-colors',
                  isActive ? 'bg-surface-muted text-ink' : 'text-ink/60 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
