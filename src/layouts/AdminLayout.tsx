import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/layout/AdminMobileNav';
import { AdminTopbar } from '@/components/admin/layout/AdminTopbar';
import { AdminToaster } from '@/components/admin/ui/AdminToaster';
import { useDisclosure } from '@/hooks/useDisclosure';
import { PageLoader } from '@/components/ui/PageLoader';

/**
 * Admin's own layout shell — intentionally not built from the storefront's
 * Header/Footer/RootLayout. Different visual language (slate/indigo,
 * rounded, dense) and a different structure (fixed sidebar + topbar,
 * no announcement bar/footer) so it reads as an operations tool, not the
 * customer-facing brand site.
 */
export function AdminLayout() {
  const mobileNav = useDisclosure();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <AdminSidebar className="hidden w-60 shrink-0 lg:flex" />
      <AdminMobileNav isOpen={mobileNav.isOpen} onClose={mobileNav.close} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenMobileNav={mobileNav.open} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <AdminToaster />
    </div>
  );
}
