import { useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import type { TopEntry } from '@/services/dashboardService';

export interface FunnelChartProps {
  /** In stage order — the first entry is treated as the funnel's widest (100%) stage. */
  data: TopEntry[];
  color?: string;
}

/** Conversion funnel — a decreasing-width trapezoid stack, the standard shape for a drop-off funnel, distinct from a ranked bar list. */
export function FunnelChart({ data, color = '#7C3AED' }: FunnelChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const first = data[0]?.value ?? 0;
  if (data.length === 0 || first === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data</div>;
  }

  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      {data.map((stage, i) => {
        const widthPct = Math.max(6, (stage.value / first) * 100);
        const prevWidthPct = i === 0 ? 100 : Math.max(6, (data[i - 1]!.value / first) * 100);
        const inset = (100 - widthPct) / 2;
        const prevInset = (100 - prevWidthPct) / 2;
        const dropFromPrevious = i === 0 ? null : data[i - 1]!.value > 0 ? (stage.value / data[i - 1]!.value) * 100 : 0;
        const isHovered = hoverIndex === i;

        return (
          <div key={stage.name} className="relative w-full max-w-md">
            <motion.div
              className="relative flex h-11 items-center justify-center overflow-hidden text-center text-xs font-medium text-white"
              style={{
                clipPath: `polygon(${prevInset}% 0%, ${100 - prevInset}% 0%, ${100 - inset}% 100%, ${inset}% 100%)`,
                backgroundColor: color,
                opacity: isHovered ? 1 : Math.max(0.55, 1 - i * 0.09),
              }}
              initial={prefersReducedMotion ? undefined : { scaleY: 0.4, opacity: 0 }}
              animate={{ scaleY: 1, opacity: isHovered ? 1 : Math.max(0.55, 1 - i * 0.09) }}
              transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : i * 0.08, ease: [0.4, 0, 0.2, 1] }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <span className="truncate px-2">
                {stage.name} · {stage.value}
              </span>
            </motion.div>

            <AnimatePresence>
              {isHovered ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg"
                >
                  <div className="font-semibold">
                    {stage.name}: {stage.value}
                  </div>
                  <div className="text-slate-300">
                    {((stage.value / first) * 100).toFixed(0)}% of {data[0]!.name}
                    {dropFromPrevious !== null ? ` · ${dropFromPrevious.toFixed(0)}% of previous stage` : ''}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
