import { useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import type { TopEntry } from '@/services/dashboardService';

export interface BarChartProps {
  data: TopEntry[];
  formatValue?: (value: number) => string;
  color?: string;
}

/** Horizontal bar chart for "top N" breakdowns — plain divs, no SVG needed for this shape. */
export function BarChart({ data, formatValue = (v) => String(v), color = '#4F46E5' }: BarChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-slate-400">No data</div>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex flex-col gap-3">
      {data.map((entry, index) => {
        const widthPercent = Math.max(4, (entry.value / max) * 100);
        const isHovered = hoverIndex === index;
        return (
          <div
            key={entry.name}
            className="relative -mx-2 rounded-md px-2 py-1 transition-colors duration-150"
            style={{ backgroundColor: isHovered ? `${color}0d` : 'transparent' }}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className={isHovered ? 'truncate font-medium text-slate-900' : 'truncate text-slate-700'}>{entry.name}</span>
              <span className="shrink-0 font-medium text-slate-900">{formatValue(entry.value)}</span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-slate-100">
              <motion.div
                className="h-2.5 rounded-full"
                style={{ backgroundColor: color, boxShadow: isHovered ? `0 0 0 3px ${color}33` : 'none' }}
                initial={prefersReducedMotion ? undefined : { width: 0 }}
                animate={{ width: `${widthPercent}%`, scaleY: isHovered ? 1.15 : 1 }}
                transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : index * 0.05, ease: [0.4, 0, 0.2, 1] }}
              />
              <AnimatePresence>
                {isHovered ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 4, x: '-50%' }}
                    transition={{ duration: 0.15 }}
                    className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg"
                    style={{ left: `${widthPercent}%` }}
                  >
                    {entry.name}: {formatValue(entry.value)}
                    <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
