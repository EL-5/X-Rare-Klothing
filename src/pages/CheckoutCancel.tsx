import { useLocation, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { buttonClassNames } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';

interface CancelState {
  message?: string;
}

/** Reached when a checkout session expires (30 minutes, enforced server-side in process_payment) or is otherwise abandoned. */
export function CheckoutCancel() {
  const { state } = useLocation() as { state: CancelState | null };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center lg:px-8">
      <XCircle className="h-12 w-12 text-danger" />
      <h1 className="mt-6 text-2xl font-semibold uppercase tracking-wide text-ink">Checkout Cancelled</h1>
      <p className="mt-3 text-sm text-ink/70">
        {state?.message ?? 'Your checkout session was cancelled. Your cart has not been charged.'}
      </p>

      <div className="mt-8 flex gap-3">
        <Link to={ROUTES.shop} className={buttonClassNames({ variant: 'outline' })}>
          Continue Shopping
        </Link>
        <Link to={ROUTES.checkout} className={buttonClassNames()}>
          Return to Checkout
        </Link>
      </div>
    </div>
  );
}
