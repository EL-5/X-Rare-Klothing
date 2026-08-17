import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Package, MapPin, Heart, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/stores/AuthStore';
import { orderService } from '@/services/orderService';
import { wishlistService } from '@/services/wishlistService';
import { formatMoney } from '@/utils/money';
import { Reveal } from '@/components/about/Reveal';
import { ROUTES } from '@/config/routes';
import type { Order } from '@/types/domain';

const CARDS = [
  { to: ROUTES.accountOrders, title: 'Orders', description: 'Track and review past purchases.', icon: Package },
  { to: ROUTES.accountAddresses, title: 'Addresses', description: 'Manage shipping and billing addresses.', icon: MapPin },
  { to: ROUTES.accountWishlist, title: 'Wishlist', description: 'Saved pieces for later.', icon: Heart },
  { to: ROUTES.accountSettings, title: 'Settings', description: 'Password, email preferences, sign out.', icon: SettingsIcon },
];

// Cancelled/refunded orders never became real spend — excluded from the
// "lifetime spent" figure so it reflects money that actually changed hands.
const UNCOUNTED_STATUSES = new Set(['cancelled', 'refunded']);

export function AccountOverview() {
  const { profile, isStaff } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [wishlistCount, setWishlistCount] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    orderService.listForCustomer(profile.id).then(setOrders);
    wishlistService.list(profile.id).then((items) => setWishlistCount(items.length));
  }, [profile]);

  const countedOrders = orders?.filter((order) => !UNCOUNTED_STATUSES.has(order.status)) ?? [];
  const lifetimeSpentCents = countedOrders.reduce((sum, order) => sum + order.total.cents, 0);
  const currency = countedOrders[0]?.total.currency ?? 'USD';

  // Staff have no other way to find the admin area from the customer UI —
  // the header/nav has no admin link anywhere — so surface it here.
  const cards = isStaff
    ? [
        { to: ROUTES.admin, title: 'Admin Dashboard', description: 'Manage products, orders, and store settings.', icon: ShieldCheck },
        ...CARDS,
      ]
    : CARDS;

  return (
    <div>
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Account</p>
        <h1 className="mt-2 text-3xl font-semibold uppercase tracking-tight text-ink lg:text-4xl">
          Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}.
        </h1>
        <p className="mt-2 text-sm text-ink/60">{profile?.email}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 grid grid-cols-3 divide-x divide-border border-y border-border">
          <div className="px-2 py-6 text-center sm:px-8 sm:text-left">
            <p className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {orders === null ? '—' : countedOrders.length}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink/50 sm:text-xs">Orders</p>
          </div>
          <div className="px-2 py-6 text-center sm:px-8 sm:text-left">
            <p className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {orders === null ? '—' : formatMoney({ cents: lifetimeSpentCents, currency })}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink/50 sm:text-xs">Lifetime Spent</p>
          </div>
          <div className="px-2 py-6 text-center sm:px-8 sm:text-left">
            <p className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{wishlistCount ?? '—'}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink/50 sm:text-xs">Saved Pieces</p>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.to}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: prefersReducedMotion ? 0 : 0.15 + index * 0.06, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link
                to={card.to}
                className="group flex items-start gap-4 border border-border p-6 transition-colors duration-200 hover:border-ink hover:bg-surface-muted"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border text-ink/70 transition-colors duration-200 group-hover:border-ink group-hover:text-ink">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">{card.title}</h2>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-ink/30 transition-colors duration-200 group-hover:text-ink"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-1 text-sm text-ink/60">{card.description}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
