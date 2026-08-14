import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartProvider } from '@/stores/CartStore';
import { WishlistProvider } from '@/stores/WishlistStore';
import { UIProvider } from '@/stores/UIStore';
import { analyticsService } from '@/services/analyticsService';
import { PageLoader } from '@/components/ui/PageLoader';
import { useStructuredData } from '@/hooks/useStructuredData';

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'X-Rare',
  url: typeof window !== 'undefined' ? window.location.origin : undefined,
  logo: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined,
  sameAs: ['https://instagram.com'],
};

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    void analyticsService.trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

/** Storefront chrome — header/footer/cart/wishlist. Not used by /admin, which has its own minimal layout. */
export function RootLayout() {
  useStructuredData(ORGANIZATION_SCHEMA);

  return (
    <CartProvider>
      <WishlistProvider>
        <UIProvider>
          <div className="flex min-h-screen flex-col">
            <PageViewTracker />
            <Header />
            <main className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </main>
            <Footer />
          </div>
        </UIProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
