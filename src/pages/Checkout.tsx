import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PaymentMethodSelector, type PaymentMethod } from '@/components/checkout/PaymentMethodSelector';
import { useCart } from '@/stores/CartStore';
import { useAuth } from '@/stores/AuthStore';
import { addressService } from '@/services/addressService';
import { shippingService } from '@/services/shippingService';
import { taxService } from '@/services/taxService';
import { checkoutService } from '@/services/checkoutService';
import { paymentService } from '@/services/paymentService';
import { analyticsService } from '@/services/analyticsService';
import { ROUTES } from '@/config/routes';
import { formatMoney } from '@/utils/money';
import type { Address, Money, ShippingRate } from '@/types/domain';
import type { CheckoutAddressInput } from '@/types/database';

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'GH', label: 'Ghana' },
  { value: 'NG', label: 'Nigeria' },
];

interface AddressForm {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
}

const EMPTY_ADDRESS: AddressForm = {
  firstName: '',
  lastName: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'GH',
  phone: '',
};

function addressToForm(address: Address): AddressForm {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company ?? '',
    address1: address.line1,
    address2: address.line2 ?? '',
    city: address.city,
    region: address.region ?? '',
    postalCode: address.postalCode ?? '',
    country: address.country,
    phone: address.phone ?? '',
  };
}

/**
 * Single-page checkout — sections appear in the required flow order
 * (Customer info → Shipping address → Shipping method → Discount → Order
 * summary → Payment) but submit together, matching how modern checkouts
 * (Shopify's included) actually work rather than a hard multi-step wizard.
 */
export function Checkout() {
  const navigate = useNavigate();
  const { cart, isLoading: isCartLoading, applyDiscountCode, removeDiscountCode, refresh: refreshCart } = useCart();
  const { isAuthenticated, profile } = useAuth();

  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState<Address[] | null>(null);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>('new');

  const [shippingRates, setShippingRates] = useState<ShippingRate[] | null>(null);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | null>(null);

  const [discountInput, setDiscountInput] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [pendingOrder, setPendingOrder] = useState<{ id: string; number: string; totalCents: number; currency: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  useEffect(() => {
    if (profile?.email) setEmail(profile.email);
  }, [profile]);

  useEffect(() => {
    if (cart && cart.items.length > 0) {
      void analyticsService.trackCheckoutStarted(cart.total.cents);
    }
    // Only fires once per cart the checkout page is opened with, not on every recalculation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id]);

  useEffect(() => {
    if (!profile) {
      setSavedAddresses(null);
      return;
    }
    addressService.listForCustomer(profile.id).then((addresses) => {
      setSavedAddresses(addresses);
      const defaultShipping = addresses.find((a) => a.type === 'shipping' && a.isDefault) ?? addresses.find((a) => a.type === 'shipping');
      if (defaultShipping) {
        setAddress(addressToForm(defaultShipping));
        setSelectedSavedAddressId(defaultShipping.id);
      }
    });
  }, [profile]);

  // Re-resolves shipping methods to the entered destination's zone (Accra/
  // Tema get their own rates, the rest of Ghana falls back to "Other
  // Ghana", everything else to International) rather than listing every
  // active method regardless of where the order is going.
  useEffect(() => {
    if (!address.country) return;
    const handle = setTimeout(() => {
      shippingService.listRatesForAddress(address.country, address.city.trim() || null).then(setShippingRates);
    }, 300);
    return () => clearTimeout(handle);
  }, [address.country, address.city]);

  const eligibleRates = useMemo(() => {
    if (!shippingRates || !cart) return [];
    const payable = { cents: Math.max(0, cart.subtotal.cents - cart.discount.cents), currency: cart.currency };
    return shippingRates.filter((rate) => !rate.minOrder || payable.cents >= rate.minOrder.cents);
  }, [shippingRates, cart]);

  useEffect(() => {
    if (eligibleRates.length === 0) {
      setSelectedShippingMethodId(null);
      return;
    }
    if (!selectedShippingMethodId || !eligibleRates.some((r) => r.id === selectedShippingMethodId)) {
      setSelectedShippingMethodId(eligibleRates[0]!.id);
    }
  }, [eligibleRates, selectedShippingMethodId]);

  const selectedRate = useMemo(
    () => eligibleRates.find((r) => r.id === selectedShippingMethodId) ?? null,
    [eligibleRates, selectedShippingMethodId],
  );

  const [taxEstimate, setTaxEstimate] = useState<Money | null>(null);

  // Keeps the order summary's shipping/tax lines honest once a real
  // destination is known — the cart's own estimate (used before the
  // checkout form is filled in) doesn't know the customer's actual address
  // or which method they picked, so it can disagree with what they're
  // about to be charged.
  useEffect(() => {
    if (!cart || !address.country || !address.city.trim()) {
      setTaxEstimate(null);
      return;
    }
    const afterDiscount: Money = { cents: Math.max(0, cart.subtotal.cents - cart.discount.cents), currency: cart.currency };
    const shippingAmount: Money = { cents: selectedRate?.price.cents ?? 0, currency: cart.currency };
    taxService.estimate(address.country, address.region || null, afterDiscount, shippingAmount).then(setTaxEstimate);
  }, [cart, address.country, address.region, address.city, selectedRate]);

  const displayTotal = useMemo<Money | null>(() => {
    if (!cart) return null;
    const shippingCents = selectedRate?.price.cents ?? 0;
    return {
      cents: Math.max(0, cart.subtotal.cents - cart.discount.cents) + shippingCents + (taxEstimate?.cents ?? 0),
      currency: cart.currency,
    };
  }, [cart, selectedRate, taxEstimate]);

  const handleSelectSavedAddress = (id: string) => {
    setSelectedSavedAddressId(id);
    if (id === 'new') {
      setAddress(EMPTY_ADDRESS);
      return;
    }
    const found = savedAddresses?.find((a) => a.id === id);
    if (found) setAddress(addressToForm(found));
  };

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setIsApplyingDiscount(true);
    setFormError(null);
    try {
      await applyDiscountCode(discountInput);
      setDiscountInput('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not apply discount code.');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const buildShippingAddress = (): CheckoutAddressInput => ({
    first_name: address.firstName,
    last_name: address.lastName,
    company: address.company || undefined,
    address1: address.address1,
    address2: address.address2 || undefined,
    city: address.city,
    region: address.region || undefined,
    postal_code: address.postalCode || undefined,
    country_code: address.country,
    phone: address.phone || undefined,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setPaymentError(null);

    if (!cart || cart.items.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }
    if (!email.trim()) {
      setFormError('Enter your email address.');
      return;
    }
    if (!address.firstName || !address.lastName || !address.address1 || !address.city || !address.country) {
      setFormError('Fill in your full shipping address.');
      return;
    }
    if (!selectedShippingMethodId) {
      setFormError('Select a shipping method.');
      return;
    }
    if (paymentMethod === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim())) {
      setFormError('Enter your card details.');
      return;
    }

    setIsSubmitting(true);
    try {
      let order = pendingOrder;

      if (!order) {
        const created = await checkoutService.placeOrder({
          cartId: cart.id,
          email: email.trim(),
          shippingAddress: buildShippingAddress(),
          shippingMethodId: selectedShippingMethodId,
        });
        order = { id: created.orderId, number: created.orderNumber, totalCents: created.totalCents, currency: created.currency };
        setPendingOrder(order);

        // The discount code shown in the cart can lose its race against
        // someone else redeeming the last use between "apply" and
        // "place order" — the order still succeeds (an expired/exhausted
        // code isn't a reason to block checkout), just without the
        // discount, so tell the customer their total changed rather than
        // let them discover it silently.
        if (cart.discountCode && created.discountCents < cart.discount.cents) {
          setFormError('Your discount code could no longer be applied, so your order total was adjusted.');
        }
      }

      void analyticsService.trackPaymentStarted(order.id);

      if (paymentMethod !== 'card') {
        // Real Paystack/Flutterwave path: initialize-payment (Edge Function)
        // records the payment attempt and returns a provider-hosted checkout
        // URL — this browser tab never sees a secret key or decides the
        // outcome itself (see Batch 12: "never mark an order paid based
        // solely on frontend callback"). The redirect lands back on
        // /checkout/verify, which only ever displays whatever the webhook
        // has already committed server-side.
        const redirectUrl = `${window.location.origin}${ROUTES.checkoutVerify}?orderId=${order.id}`;
        const result = await paymentService.initializeLivePayment(order.id, paymentMethod, redirectUrl);
        window.location.href = result.authorizationUrl;
        return;
      }

      const payment = await checkoutService.pay(order.id, cardNumber);
      if (payment.status === 'failed') {
        setPaymentError(payment.message ?? 'Your card was declined. Please try a different card.');
        return;
      }

      void analyticsService.trackPurchase(order.id, order.totalCents);
      await refreshCart();
      navigate(ROUTES.checkoutSuccess, {
        state: { orderNumber: order.number, totalCents: order.totalCents, currency: order.currency, email: email.trim() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      if (message.toLowerCase().includes('expired')) {
        navigate(ROUTES.checkoutCancel, { state: { message } });
        return;
      }
      if (pendingOrder) {
        setPaymentError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCartLoading) {
    return <div className="mx-auto max-w-[var(--container-max)] px-6 py-24 text-center text-sm text-ink/60 lg:px-8">Loading checkout…</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--container-max)] px-6 py-24 text-center lg:px-8">
        <p className="text-sm text-ink/70">Your cart is empty.</p>
        <Link to={ROUTES.shop} className="mt-4 inline-block text-sm underline-offset-2 hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8 lg:py-12">
      <Link to={ROUTES.home} className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-ink">
        <img src="/logo.png" alt="" className="h-5 w-auto" />
        X-Rare
      </Link>

      <button
        type="button"
        onClick={() => setIsMobileSummaryOpen((v) => !v)}
        className="mt-6 flex w-full items-center justify-between border-y border-border py-4 text-sm text-ink lg:hidden"
      >
        <span className="flex items-center gap-2">
          {isMobileSummaryOpen ? 'Hide' : 'Show'} order summary
          <ChevronDown className={`h-4 w-4 transition-transform ${isMobileSummaryOpen ? 'rotate-180' : ''}`} />
        </span>
        <span className="font-semibold">{formatMoney(displayTotal ?? cart.total)}</span>
      </button>
      {isMobileSummaryOpen ? (
        <div className="border-b border-border pb-6 lg:hidden">
          <OrderSummary cart={cart} shippingOverride={selectedRate?.price ?? null} taxOverride={taxEstimate} totalOverride={displayTotal} />
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Customer Information</h2>
            {isAuthenticated ? (
              <p className="mt-3 text-sm text-ink">{email}</p>
            ) : (
              <div className="mt-3">
                <Input type="email" required label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <p className="mt-2 text-xs text-ink/50">
                  Have an account?{' '}
                  <Link to={ROUTES.login} className="underline-offset-2 hover:underline">
                    Log in
                  </Link>{' '}
                  for faster checkout.
                </p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Shipping Address</h2>

            {savedAddresses && savedAddresses.filter((a) => a.type === 'shipping').length > 0 ? (
              <select
                value={selectedSavedAddressId}
                onChange={(e) => handleSelectSavedAddress(e.target.value)}
                className="mt-3 h-11 w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-ink focus:border-ink focus:outline-none"
              >
                {savedAddresses
                  .filter((a) => a.type === 'shipping')
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.line1}, {a.city}
                    </option>
                  ))}
                <option value="new">Use a new address</option>
              </select>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Input required label="First name" value={address.firstName} onChange={(e) => setAddress({ ...address, firstName: e.target.value })} />
              <Input required label="Last name" value={address.lastName} onChange={(e) => setAddress({ ...address, lastName: e.target.value })} />
              <Input
                containerClassName="col-span-2"
                label="Company (optional)"
                value={address.company}
                onChange={(e) => setAddress({ ...address, company: e.target.value })}
              />
              <Input
                containerClassName="col-span-2"
                required
                label="Address"
                value={address.address1}
                onChange={(e) => setAddress({ ...address, address1: e.target.value })}
              />
              <Input
                containerClassName="col-span-2"
                label="Apartment, suite, etc. (optional)"
                value={address.address2}
                onChange={(e) => setAddress({ ...address, address2: e.target.value })}
              />
              <Input required label="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <Input label="State / Region" value={address.region} onChange={(e) => setAddress({ ...address, region: e.target.value })} />
              <Input label="Postal code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
              <Select
                label="Country"
                options={COUNTRY_OPTIONS}
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
              />
              <Input containerClassName="col-span-2" label="Phone (optional)" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Shipping Method</h2>
            <div className="mt-3 flex flex-col gap-2">
              {eligibleRates.length === 0 ? (
                <p className="text-sm text-ink/50">Enter your address to see shipping options.</p>
              ) : (
                eligibleRates.map((rate) => (
                  <label
                    key={rate.id}
                    className={`flex cursor-pointer items-center justify-between rounded-[var(--radius-input)] border px-4 py-3 text-sm transition-colors ${
                      selectedShippingMethodId === rate.id ? 'border-ink' : 'border-border'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping-method"
                        checked={selectedShippingMethodId === rate.id}
                        onChange={() => setSelectedShippingMethodId(rate.id)}
                        className="accent-ink"
                      />
                      {rate.name}
                    </span>
                    <span className="text-ink">{rate.price.cents === 0 ? 'Free' : formatMoney(rate.price)}</span>
                  </label>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Discount</h2>
            {cart.discountCode ? (
              <div className="mt-3 flex items-center justify-between rounded-sm bg-surface-muted px-3 py-2 text-xs">
                <span className="uppercase tracking-wide text-ink">{cart.discountCode} applied</span>
                <button type="button" onClick={() => void removeDiscountCode()} className="text-ink/50 hover:text-ink">
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleApplyDiscount();
                    }
                  }}
                  className="h-11 w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-ink focus:border-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleApplyDiscount()}
                  disabled={isApplyingDiscount || !discountInput.trim()}
                  className="h-11 shrink-0 border border-ink px-4 text-xs uppercase tracking-wide text-ink hover:bg-ink hover:text-surface disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Payment</h2>
            <div className="mt-3">
              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
            </div>

            {paymentMethod === 'card' ? (
              <>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/50">
                  <Lock className="h-3 w-3" /> Demo payment — no real card is charged. Any 16-digit number succeeds; one ending in 0002 is declined.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Input
                    containerClassName="col-span-2"
                    required
                    label="Card number"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                  <Input required label="Expiry (MM/YY)" placeholder="12/28" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                  <Input required label="CVC" inputMode="numeric" placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
                </div>
              </>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/50">
                <Lock className="h-3 w-3" /> You'll be redirected to {paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'} to complete payment
                securely. Not deployed in this environment yet — see project notes.
              </p>
            )}
            {paymentError ? <p className="mt-3 text-sm text-danger">{paymentError}</p> : null}
          </section>

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
            {paymentMethod !== 'card'
              ? `Continue to ${paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'}`
              : pendingOrder
                ? `Retry Payment — ${formatMoney({ cents: pendingOrder.totalCents, currency: pendingOrder.currency })}`
                : `Pay ${formatMoney(displayTotal ?? cart.total)}`}
          </Button>
        </div>

        <div className="hidden border-l border-border pl-12 lg:block">
          <OrderSummary cart={cart} shippingOverride={selectedRate?.price ?? null} taxOverride={taxEstimate} totalOverride={displayTotal} />
        </div>
      </form>
    </div>
  );
}
