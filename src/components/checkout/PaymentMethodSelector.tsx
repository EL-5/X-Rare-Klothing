import type { LivePaymentProvider } from '@/repositories/paymentRepository';

export type PaymentMethod = 'card' | LivePaymentProvider;

export interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Demo Card' },
  { value: 'paystack', label: 'Paystack' },
  { value: 'flutterwave', label: 'Flutterwave' },
];

/** Provider-independent by design — swapping the selected method swaps which PaymentProvider implementation checkoutService talks to, nothing else changes (see Batch 12). */
export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="flex flex-wrap gap-2">
      {METHODS.map((method) => (
        <button
          key={method.value}
          type="button"
          role="radio"
          aria-checked={value === method.value}
          onClick={() => onChange(method.value)}
          className={`h-10 rounded-[var(--radius-input)] border px-4 text-xs uppercase tracking-wide transition-colors ${
            value === method.value ? 'border-ink bg-ink text-surface' : 'border-border text-ink hover:border-ink'
          }`}
        >
          {method.label}
        </button>
      ))}
    </div>
  );
}
