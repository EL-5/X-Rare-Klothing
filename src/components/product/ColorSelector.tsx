export interface ColorSelectorProps {
  colors: string[];
  selected: string | null;
  onChange: (color: string) => void;
}

/** Swatch radio group — mirrors the reference's Color variant input (see docs/interaction-map.md). */
export function ColorSelector({ colors, selected, onChange }: ColorSelectorProps) {
  if (colors.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/50">
        Color{selected ? <span className="ml-1 text-ink">— {selected}</span> : null}
      </p>
      <div role="radiogroup" aria-label="Color" className="mt-2 flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected === color}
            onClick={() => onChange(color)}
            className={`h-9 rounded-[var(--radius-input)] border px-3 text-xs uppercase tracking-wide transition-colors ${
              selected === color ? 'border-ink bg-ink text-surface' : 'border-border text-ink hover:border-ink'
            }`}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}
