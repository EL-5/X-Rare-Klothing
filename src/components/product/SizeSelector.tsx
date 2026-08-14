export interface SizeSelectorProps {
  sizes: string[];
  selected: string | null;
  onChange: (size: string) => void;
}

/** Pill radio group — mirrors the reference's Size variant input (see docs/interaction-map.md). */
export function SizeSelector({ sizes, selected, onChange }: SizeSelectorProps) {
  if (sizes.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/50">
        Size{selected ? <span className="ml-1 text-ink">— {selected}</span> : null}
      </p>
      <div role="radiogroup" aria-label="Size" className="mt-2 flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={selected === size}
            onClick={() => onChange(size)}
            className={`h-9 min-w-9 rounded-[var(--radius-input)] border px-3 text-xs uppercase tracking-wide transition-colors ${
              selected === size ? 'border-ink bg-ink text-surface' : 'border-border text-ink hover:border-ink'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
