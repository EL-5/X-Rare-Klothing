import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartProvider } from '@/stores/CartStore';
import { UIProvider } from '@/stores/UIStore';

/** Storefront chrome — header/footer/cart. Not used by /admin, which has its own minimal layout. */
export function RootLayout() {
  return (
    <CartProvider>
      <UIProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </UIProvider>
    </CartProvider>
  );
}
