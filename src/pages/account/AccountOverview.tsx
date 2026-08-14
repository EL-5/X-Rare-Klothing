import { Link } from 'react-router-dom';
import { useAuth } from '@/stores/AuthStore';
import { ROUTES } from '@/config/routes';

export function AccountOverview() {
  const { profile } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold uppercase tracking-wide text-ink">
        Welcome{profile?.firstName ? `, ${profile.firstName}` : ''}
      </h1>
      <p className="mt-2 text-sm text-ink/60">{profile?.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to={ROUTES.accountOrders}
          className="border border-border p-6 transition-colors hover:border-ink"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">Orders</h2>
          <p className="mt-1 text-sm text-ink/60">Track and review past purchases.</p>
        </Link>
        <Link
          to={ROUTES.accountAddresses}
          className="border border-border p-6 transition-colors hover:border-ink"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">Addresses</h2>
          <p className="mt-1 text-sm text-ink/60">Manage shipping and billing addresses.</p>
        </Link>
        <Link
          to={ROUTES.accountWishlist}
          className="border border-border p-6 transition-colors hover:border-ink"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">Wishlist</h2>
          <p className="mt-1 text-sm text-ink/60">Saved pieces for later.</p>
        </Link>
        <Link
          to={ROUTES.accountSettings}
          className="border border-border p-6 transition-colors hover:border-ink"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">Settings</h2>
          <p className="mt-1 text-sm text-ink/60">Password, email preferences, sign out.</p>
        </Link>
      </div>
    </div>
  );
}
