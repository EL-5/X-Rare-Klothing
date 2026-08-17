import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { buttonClassNames } from '@/components/ui/Button';
import { useCart } from '@/stores/CartStore';
import { useToast } from '@/stores/ToastStore';
import { ROUTES } from '@/config/routes';
import { formatMoney } from '@/utils/money';

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, isLoading, updateItemQuantity, removeItem, clearCart, applyDiscountCode, removeDiscountCode } = useCart();
  const { show } = useToast();
  const [discountInput, setDiscountInput] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleApplyDiscount = async (event: FormEvent) => {
    event.preventDefault();
    if (!discountInput.trim()) return;
    setIsApplyingDiscount(true);
    try {
      await applyDiscountCode(discountInput);
      setDiscountInput('');
      show({ title: 'Discount applied', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not apply code', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      await updateItemQuantity(itemId, quantity);
    } catch (err) {
      show({ title: 'Could not update quantity', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      await clearCart();
    } catch (err) {
      show({ title: 'Could not clear cart', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Cart">
      {isLoading ? (
        <div className="p-6 text-sm text-ink/60">Loading cart…</div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-ink/70">Your cart is currently empty.</p>
          <Link to={ROUTES.shop} onClick={onClose} className={buttonClassNames({ variant: 'outline', size: 'sm' })}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 pt-4">
            <p className="text-xs text-ink/60">
              {cart.items.reduce((sum, item) => sum + item.quantity, 0)} item{cart.items.length === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              onClick={() => void handleClearCart()}
              disabled={isClearing}
              className="text-xs text-ink/60 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Clear cart
            </button>
          </div>

          <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
            {cart.items.map((item, index) => (
              <motion.li
                key={item.id}
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : Math.min(index, 10) * 0.05 }}
                className="flex gap-4 py-4"
              >
                <div className="h-20 w-16 shrink-0 overflow-hidden bg-surface-muted">
                  {item.product.images[0] ? (
                    <img src={item.product.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-sm font-medium text-ink">{item.product.title}</p>
                  <p className="text-xs text-ink/60">
                    {[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        className="h-7 w-7 border border-border text-sm"
                        onClick={() => void handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        className="h-7 w-7 border border-border text-sm"
                        onClick={() => void handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-medium">{formatMoney(item.lineTotal)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeItem(item.id)}
                    className="mt-1 self-start text-xs text-ink/60 underline-offset-2 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>

          <div className="border-t border-border p-6">
            {cart.discountCode ? (
              <div className="mb-4 flex items-center justify-between rounded-sm bg-surface-muted px-3 py-2 text-xs">
                <span className="uppercase tracking-wide text-ink">{cart.discountCode}</span>
                <button type="button" onClick={() => void removeDiscountCode()} aria-label="Remove discount code" className="text-ink/60 hover:text-ink">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyDiscount} className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Discount code"
                  aria-label="Discount code"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="h-9 w-full rounded-[var(--radius-input)] border border-border bg-surface px-3 text-xs text-ink focus:border-ink focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isApplyingDiscount || !discountInput.trim()}
                  className="h-9 shrink-0 border border-ink px-3 text-xs uppercase tracking-wide text-ink hover:bg-ink hover:text-surface disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}

            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between text-ink">
                <span>Subtotal</span>
                <span>{formatMoney(cart.subtotal)}</span>
              </div>
              {cart.discount.cents > 0 ? (
                <div className="flex items-center justify-between text-success">
                  <span>Discount</span>
                  <span>−{formatMoney(cart.discount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-ink/60">
                <span>Shipping</span>
                <span>{cart.shippingEstimate ? (cart.shippingEstimate.cents === 0 ? 'Free' : formatMoney(cart.shippingEstimate)) : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-ink/60">
                <span>Estimated tax</span>
                <span>{cart.taxEstimate ? formatMoney(cart.taxEstimate) : 'Calculated at checkout'}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-ink">
              <span>Total</span>
              <span>{formatMoney(cart.total)}</span>
            </div>

            <Link to={ROUTES.checkout} onClick={onClose} className={buttonClassNames({ size: 'lg' }, 'mt-4 w-full')}>
              Checkout
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
