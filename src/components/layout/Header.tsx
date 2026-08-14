import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Heart, User, ShoppingBag } from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SearchDrawer } from '@/components/search/SearchDrawer';
import { useUIStore } from '@/stores/UIStore';
import { useCart } from '@/stores/CartStore';
import { useAuth } from '@/stores/AuthStore';
import { useWishlist } from '@/stores/WishlistStore';
import { settingsService } from '@/services/settingsService';
import { ROUTES } from '@/config/routes';

/**
 * Fixed-black header bar with center logo and right-aligned icon row
 * (search / wishlist / account / cart) — mirrors the reference's
 * `.header-section` (see docs/component-inventory.md, docs/design-system.md).
 */
export function Header() {
  const { cartDrawer, searchDrawer, mobileNav } = useUIStore();
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { productIds: wishlistProductIds } = useWishlist();
  const wishlistCount = wishlistProductIds.size;
  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    settingsService.getAll().then((settings) => {
      const enabled = settings.announcement_enabled;
      const message = settings.announcement_message;
      if (enabled !== false && typeof message === 'string' && message.trim()) setAnnouncement(message);
    });
  }, []);

  return (
    <header className="sticky top-0 z-30">
      {announcement ? <AnnouncementBar message={announcement} /> : null}

      <div className="bg-header text-header-foreground">
        <div className="mx-auto flex h-[72px] max-w-[var(--container-max)] items-center justify-between px-6 lg:px-8">
          <button
            type="button"
            onClick={mobileNav.open}
            aria-label="Open menu"
            className="text-header-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to={ROUTES.home} className="flex items-center gap-2">
            <img src="/logo-white.png" alt="" className="h-6 w-auto" />
            <span className="text-lg font-semibold uppercase tracking-widest">X-Rare</span>
          </Link>

          <DesktopNavigation />

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={searchDrawer.open}
              aria-label="Search"
              className="text-header-foreground transition-opacity duration-[var(--duration-base)] hover:opacity-80"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              to={ROUTES.accountWishlist}
              aria-label={`Wishlist, ${wishlistCount} item${wishlistCount === 1 ? '' : 's'}`}
              className="relative hidden text-header-foreground transition-opacity duration-[var(--duration-base)] hover:opacity-80 sm:inline-flex"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>

            <Link
              to={isAuthenticated ? ROUTES.account : ROUTES.login}
              aria-label={isAuthenticated ? 'Account' : 'Log in'}
              className="hidden text-header-foreground transition-opacity duration-[var(--duration-base)] hover:opacity-80 sm:inline-flex"
            >
              <User className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={cartDrawer.open}
              aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
              className="relative text-header-foreground transition-opacity duration-[var(--duration-base)] hover:opacity-80"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <MobileNavigation isOpen={mobileNav.isOpen} onClose={mobileNav.close} />
      <SearchDrawer isOpen={searchDrawer.isOpen} onClose={searchDrawer.close} />
      <CartDrawer isOpen={cartDrawer.isOpen} onClose={cartDrawer.close} />
    </header>
  );
}
