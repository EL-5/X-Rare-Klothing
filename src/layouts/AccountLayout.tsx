import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, User, Package, MapPin, Heart, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/config/routes';
import { PageLoader } from '@/components/ui/PageLoader';
import { useDocumentHead } from '@/hooks/useDocumentHead';

const navItems = [
  { label: 'Overview', href: ROUTES.account, end: true, icon: LayoutGrid },
  { label: 'Profile', href: ROUTES.accountProfile, icon: User },
  { label: 'Orders', href: ROUTES.accountOrders, icon: Package },
  { label: 'Addresses', href: ROUTES.accountAddresses, icon: MapPin },
  { label: 'Wishlist', href: ROUTES.accountWishlist, icon: Heart },
  { label: 'Settings', href: ROUTES.accountSettings, icon: SettingsIcon },
];

export function AccountLayout() {
  useDocumentHead({ title: 'Account', path: ROUTES.account, noindex: true });

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-6 py-16 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <nav aria-label="Account" className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-3 whitespace-nowrap border-l-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors duration-150 lg:shrink',
                    isActive
                      ? 'border-ink bg-surface-muted text-ink'
                      : 'border-transparent text-ink/50 hover:border-border hover:text-ink',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
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
