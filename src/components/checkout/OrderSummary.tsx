import { formatMoney } from '@/utils/money';
import type { Cart, Money } from '@/types/domain';

export interface OrderSummaryProps {
  cart: Cart;
  /** Overrides the cart's generic (address-unaware) estimates once the checkout form has resolved a real destination — e.g. the actually-selected shipping method's rate, not just the cheapest one available anywhere. */
  shippingOverride?: Money | null;
  taxOverride?: Money | null;
  totalOverride?: Money | null;
}

export function OrderSummary({ cart, shippingOverride, taxOverride, totalOverride }: OrderSummaryProps) {
  const shipping = shippingOverride !== undefined ? shippingOverride : cart.shippingEstimate;
  const tax = taxOverride !== undefined ? taxOverride : cart.taxEstimate;
  const total = totalOverride ?? cart.total;
  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {cart.items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative h-16 w-14 shrink-0 bg-surface-muted">
              {item.product.images[0] ? <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" /> : null}
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-surface">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-1 flex-col">
              <p className="text-sm text-ink">{item.product.title}</p>
              <p className="text-xs text-ink/50">{[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}</p>
            </div>
            <p className="text-sm text-ink">{formatMoney(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between text-ink">
          <span>Subtotal</span>
          <span>{formatMoney(cart.subtotal)}</span>
        </div>
        {cart.discount.cents > 0 ? (
          <div className="flex items-center justify-between text-success">
            <span>Discount{cart.discountCode ? ` (${cart.discountCode})` : ''}</span>
            <span>−{formatMoney(cart.discount)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-ink/60">
          <span>Shipping</span>
          <span>{shipping ? (shipping.cents === 0 ? 'Free' : formatMoney(shipping)) : '—'}</span>
        </div>
        <div className="flex items-center justify-between text-ink/60">
          <span>Tax</span>
          <span>{tax ? formatMoney(tax) : 'Calculated at checkout'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-ink">
        <span>Total</span>
        <span>{formatMoney(total)}</span>
      </div>
    </div>
  );
}
