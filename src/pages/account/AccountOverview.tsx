import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/stores/AuthStore';
import { ROUTES } from '@/config/routes';

const CARDS = [
  { to: ROUTES.accountOrders, title: 'Orders', description: 'Track and review past purchases.' },
  { to: ROUTES.accountAddresses, title: 'Addresses', description: 'Manage shipping and billing addresses.' },
  { to: ROUTES.accountWishlist, title: 'Wishlist', description: 'Saved pieces for later.' },
  { to: ROUTES.accountSettings, title: 'Settings', description: 'Password, email preferences, sign out.' },
];

export function AccountOverview() {
  const { profile } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div>
      <h1 className="text-xl font-semibold uppercase tracking-wide text-ink">
        Welcome{profile?.firstName ? `, ${profile.firstName}` : ''}
      </h1>
      <p className="mt-2 text-sm text-ink/60">{profile?.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CARDS.map((card, index) => (
          <motion.div
            key={card.to}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : index * 0.06 }}
          >
            <Link to={card.to} className="block border border-border p-6 transition-colors hover:border-ink">
              <h2 className="text-sm font-semibold uppercase tracking-wide">{card.title}</h2>
              <p className="mt-1 text-sm text-ink/60">{card.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
