import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { TopEntry } from '@/services/dashboardService';

export interface DonutChartProps {
  data: TopEntry[];
  formatValue?: (value: number) => string;
  /** One color per segment, in data order. Falls back to a default categorical palette, cycled if there are more segments than colors. */
  colors?: string[];
  centerLabel?: string;
}

const DEFAULT_PALETTE = ['#4F46E5', '#0EA5E9', '#16A34A', '#D97706', '#DB2777', '#7C3AED', '#64748B'];
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 70;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Share-of-whole breakdown (payment provider, order status) — distinct from the ranked BarChart lists, since this is about proportion, not ranking. */
export function DonutChart({ data, formatValue = (v) => String(v), colors = DEFAULT_PALETTE, centerLabel = 'Total' }: DonutChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0 || total === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data</div>;
  }

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const fraction = d.value / total;
    const dash = fraction * CIRCUMFERENCE;
    const offset = cumulative * CIRCUMFERENCE;
    cumulative += fraction;
    return { ...d, color: colors[i % colors.length]!, dash, offset, fraction };
  });

  const hovered = hoverIndex !== null ? segments[hoverIndex] : null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={180} height={180} role="img" aria-label="Donut chart">
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#F1F5F9" strokeWidth={STROKE} />
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {segments.map((s, i) => (
            <motion.circle
              key={s.name}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth={hoverIndex === i ? STROKE + 4 : STROKE}
              strokeDasharray={`${s.dash} ${CIRCUMFERENCE}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
              className="cursor-pointer transition-[stroke-width] duration-150"
              initial={prefersReducedMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.45 }}
              transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : i * 0.08 }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}
        </g>
        <text x={CENTER} y={CENTER - 6} textAnchor="middle" fontSize="11" fill="#94A3B8">
          {hovered ? hovered.name : centerLabel}
        </text>
        <text x={CENTER} y={CENTER + 14} textAnchor="middle" fontSize="16" fontWeight="600" fill="#0F172A">
          {formatValue(hovered ? hovered.value : total)}
        </text>
      </svg>

      <div className="flex flex-col gap-2">
        {segments.map((s, i) => (
          <div
            key={s.name}
            className="flex items-center gap-2 rounded-md px-1.5 py-0.5 text-xs transition-colors duration-150"
            style={{ backgroundColor: hoverIndex === i ? `${s.color}14` : 'transparent' }}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className={hoverIndex === i ? 'font-medium text-slate-900' : 'text-slate-700'}>{s.name}</span>
            <span className="text-slate-400">{(s.fraction * 100).toFixed(0)}%</span>
            <span className="ml-auto font-medium text-slate-900">{formatValue(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
