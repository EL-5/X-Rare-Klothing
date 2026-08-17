import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { buttonClassNames } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import { formatMoney } from '@/utils/money';

interface SuccessState {
  orderNumber?: string;
  totalCents?: number;
  currency?: string;
  email?: string;
}

/**
 * Order details arrive via router navigation state (set right after a
 * successful create_order/process_payment call) rather than a fresh DB
 * read — guest orders have no RLS SELECT policy to read back by design
 * (see 0014_rls_policies.sql), so this page never needs one either.
 */
export function CheckoutSuccess() {
  const { state } = useLocation() as { state: SuccessState | null };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center lg:px-8">
      <CheckCircle2 className="h-12 w-12 text-success" />
      <h1 className="mt-6 text-2xl font-semibold uppercase tracking-wide text-ink">Order Confirmed</h1>

      {state?.orderNumber ? (
        <p className="mt-3 text-sm text-ink/70">
          Order <span className="font-medium text-ink">{state.orderNumber}</span> has been placed.
        </p>
      ) : (
        <p className="mt-3 text-sm text-ink/70">Your order has been placed.</p>
      )}

      {state?.totalCents !== undefined && state.currency ? (
        <p className="mt-1 text-sm text-ink/70">Total charged: {formatMoney({ cents: state.totalCents, currency: state.currency })}</p>
      ) : null}

      <div className="mt-8 flex gap-3">
        <Link to={ROUTES.shop} className={buttonClassNames({ variant: 'outline' })}>
          Continue Shopping
        </Link>
        <Link to={ROUTES.accountOrders} className={buttonClassNames()}>
          View Orders
        </Link>
      </div>
    </div>
  );
}
