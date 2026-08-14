import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { buttonClassNames } from '@/components/ui/Button';
import { useCart } from '@/stores/CartStore';
import { paymentService } from '@/services/paymentService';
import { analyticsService } from '@/services/analyticsService';
import { ROUTES } from '@/config/routes';

type VerifyState = 'polling' | 'paid' | 'not_paid' | 'timeout';

/**
 * Landing page after a Paystack/Flutterwave redirect. Deliberately does
 * NOT trust the redirect itself (query params a provider appends here are
 * not a security signal — anyone can craft a URL). It only polls the
 * order's own status, which only the verified webhook (payment-webhook)
 * is ever allowed to change — see Batch 12: "Never mark an order paid
 * based solely on frontend callback."
 */
export function CheckoutVerify() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { refresh: refreshCart } = useCart();
  const [state, setState] = useState<VerifyState>('polling');

  useEffect(() => {
    if (!orderId) {
      setState('not_paid');
      return;
    }
    let cancelled = false;
    paymentService
      .pollOrderStatus(orderId, ['paid', 'pending', 'cancelled'])
      .then((status) => {
        if (cancelled) return;
        if (status === 'paid') {
          setState('paid');
          void refreshCart();
          void analyticsService.trackPurchase(orderId, 0);
        } else if (status === 'pending' || status === 'cancelled') {
          setState('not_paid');
        } else {
          setState('timeout');
        }
      })
      .catch(() => {
        if (!cancelled) setState('not_paid');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (state === 'polling') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center lg:px-8">
        <Loader2 className="h-10 w-10 animate-spin text-ink/40" />
        <h1 className="mt-6 text-lg font-semibold uppercase tracking-wide text-ink">Verifying your payment…</h1>
        <p className="mt-2 text-sm text-ink/60">This can take a few seconds — please don't close this page.</p>
      </div>
    );
  }

  if (state === 'paid') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center lg:px-8">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h1 className="mt-6 text-2xl font-semibold uppercase tracking-wide text-ink">Order Confirmed</h1>
        <p className="mt-3 text-sm text-ink/70">Your payment was successful.</p>
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

  if (state === 'timeout') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center lg:px-8">
        <Loader2 className="h-10 w-10 text-ink/40" />
        <h1 className="mt-6 text-lg font-semibold uppercase tracking-wide text-ink">Still processing</h1>
        <p className="mt-2 text-sm text-ink/60">
          Your payment is taking longer than expected to confirm. We'll email you as soon as it's done — no need to pay again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center lg:px-8">
      <XCircle className="h-12 w-12 text-danger" />
      <h1 className="mt-6 text-2xl font-semibold uppercase tracking-wide text-ink">Payment Not Completed</h1>
      <p className="mt-3 text-sm text-ink/70">Your payment wasn't completed. You haven't been charged.</p>
      <Link to={ROUTES.checkout} className={buttonClassNames({}, 'mt-8')}>
        Return to Checkout
      </Link>
    </div>
  );
}
