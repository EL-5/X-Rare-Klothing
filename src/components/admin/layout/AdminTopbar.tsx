import { Menu } from 'lucide-react';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { AdminNotificationsMenu } from './AdminNotificationsMenu';
import { AdminUserMenu } from './AdminUserMenu';

export interface AdminTopbarProps {
  onOpenMobileNav: () => void;
}

export function AdminTopbar({ onOpenMobileNav }: AdminTopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <AdminBreadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        <AdminNotificationsMenu />
        <AdminUserMenu />
      </div>
    </header>
  );
}
