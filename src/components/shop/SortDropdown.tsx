import { SORT_OPTIONS, type SortValue } from '@/hooks/useProductListing';

export interface SortDropdownProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink/70">
      Sort by
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="h-9 rounded-[var(--radius-input)] border border-border bg-surface px-2 text-xs uppercase tracking-wide text-ink focus:border-ink focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
