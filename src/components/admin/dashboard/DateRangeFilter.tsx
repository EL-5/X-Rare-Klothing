import { useState } from 'react';
import { cn } from '@/lib/cn';

export type DateRangePreset = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}

const PRESET_LABELS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

export function rangeForPreset(preset: DateRangePreset, custom?: { start: string; end: string }): DateRange {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  switch (preset) {
    case 'today':
      break;
    case '7d':
      start.setUTCDate(start.getUTCDate() - 6);
      break;
    case '30d':
      start.setUTCDate(start.getUTCDate() - 29);
      break;
    case '90d':
      start.setUTCDate(start.getUTCDate() - 89);
      break;
    case 'year':
      start.setUTCFullYear(start.getUTCFullYear() - 1);
      start.setUTCDate(start.getUTCDate() + 1);
      break;
    case 'custom':
      if (custom?.start && custom?.end) {
        return { start: new Date(`${custom.start}T00:00:00.000Z`), end: new Date(`${custom.end}T23:59:59.999Z`), preset };
      }
      break;
  }
  return { start, end, preset };
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [customStart, setCustomStart] = useState(value.start.toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState(value.end.toISOString().slice(0, 10));

  const selectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      onChange(rangeForPreset('custom', { start: customStart, end: customEnd }));
      return;
    }
    onChange(rangeForPreset(preset));
  };

  const applyCustom = () => {
    onChange(rangeForPreset('custom', { start: customStart, end: customEnd }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border border-slate-300 bg-white p-0.5">
        {PRESET_LABELS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectPreset(option.value)}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              value.preset === option.value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {value.preset === 'custom' ? (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700"
          />
          <button
            type="button"
            onClick={applyCustom}
            className="h-8 rounded-md bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}
