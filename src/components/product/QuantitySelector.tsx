export interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
}

export function QuantitySelector({ quantity, onChange, max }: QuantitySelectorProps) {
  const atMax = max !== undefined && quantity >= max;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/60">Quantity</p>
      <div className="mt-2 flex h-11 w-fit items-center border border-border">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          onClick={() => onChange(Math.max(1, quantity - 1))}
          className="flex h-full w-10 items-center justify-center text-ink disabled:opacity-30"
        >
          −
        </button>
        <span className="w-10 text-center text-sm text-ink" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={atMax}
          onClick={() => onChange(max !== undefined ? Math.min(max, quantity + 1) : quantity + 1)}
          className="flex h-full w-10 items-center justify-center text-ink disabled:opacity-30"
        >
          +
        </button>
      </div>
      {max !== undefined && max > 0 && max <= 10 ? <p className="mt-1.5 text-xs text-warning">Only {max} left in stock</p> : null}
    </div>
  );
}
