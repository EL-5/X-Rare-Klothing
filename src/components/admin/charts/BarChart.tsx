import type { TopEntry } from '@/services/dashboardService';

export interface BarChartProps {
  data: TopEntry[];
  formatValue?: (value: number) => string;
  color?: string;
}

/** Horizontal bar chart for "top N" breakdowns — plain divs, no SVG needed for this shape. */
export function BarChart({ data, formatValue = (v) => String(v), color = '#4F46E5' }: BarChartProps) {
  if (data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-slate-400">No data</div>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex flex-col gap-3">
      {data.map((entry) => (
        <div key={entry.name}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate text-slate-700">{entry.name}</span>
            <span className="shrink-0 font-medium text-slate-900">{formatValue(entry.value)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full"
              style={{ width: `${Math.max(4, (entry.value / max) * 100)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
