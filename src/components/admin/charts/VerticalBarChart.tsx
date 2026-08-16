import { useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ChartPoint } from '@/services/dashboardService';

export interface VerticalBarChartProps {
  data: ChartPoint[];
  formatValue?: (value: number) => string;
  color?: string;
}

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 24, left: 12 };
const TOOLTIP_WIDTH = 110;
const TOOLTIP_HEIGHT = 34;

/** Vertical bars per day — for discrete counts (orders placed, accounts created), as distinct from Revenue's continuous LineChart. */
export function VerticalBarChart({ data, formatValue = (v) => String(v), color = '#0EA5E9' }: VerticalBarChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data</div>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const slot = innerWidth / data.length;
  const barWidth = Math.max(1, slot * 0.6);

  const bars = data.map((d, i) => {
    const barHeight = (d.value / max) * innerHeight;
    const x = PADDING.left + slot * i + (slot - barWidth) / 2;
    const y = PADDING.top + innerHeight - barHeight;
    return { x, y, barHeight, ...d };
  });

  const labelEvery = Math.max(1, Math.ceil(bars.length / 6));

  const handleMove = (event: ReactMouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const local = pt.matrixTransform(ctm.inverse());
    const index = Math.min(data.length - 1, Math.max(0, Math.floor((local.x - PADDING.left) / slot)));
    setHoverIndex(index);
  };

  const hovered = hoverIndex !== null ? bars[hoverIndex] : null;
  const hoveredCenterX = hovered ? hovered.x + barWidth / 2 : 0;
  const tooltipX = hovered ? Math.min(Math.max(hoveredCenterX - TOOLTIP_WIDTH / 2, 4), WIDTH - TOOLTIP_WIDTH - 4) : 0;
  const tooltipY = hovered ? Math.max(hovered.y - TOOLTIP_HEIGHT - 10, 2) : 0;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full overflow-visible" role="img" aria-label="Bar chart, one bar per day">
      <line x1={PADDING.left} y1={PADDING.top + innerHeight} x2={WIDTH - PADDING.right} y2={PADDING.top + innerHeight} stroke="#E2E8F0" strokeWidth="1" />

      {bars.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x}
          width={barWidth}
          rx={Math.min(2, barWidth / 2)}
          fill={hoverIndex === i ? color : `${color}CC`}
          initial={prefersReducedMotion ? undefined : { y: PADDING.top + innerHeight, height: 0 }}
          animate={{ y: b.y, height: Math.max(1, b.barHeight) }}
          transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : i * (0.4 / bars.length), ease: [0.4, 0, 0.2, 1] }}
        />
      ))}

      {bars.map((b, i) =>
        i % labelEvery === 0 ? (
          <text key={i} x={b.x + barWidth / 2} y={HEIGHT - 6} fontSize="9" textAnchor="middle" fill="#94A3B8">
            {b.label.slice(5)}
          </text>
        ) : null,
      )}

      {hovered ? (
        <g pointerEvents="none">
          <rect x={tooltipX} y={tooltipY} width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} rx="6" fill="#0F172A" />
          <text x={tooltipX + TOOLTIP_WIDTH / 2} y={tooltipY + 14} fontSize="9" textAnchor="middle" fill="#94A3B8">
            {hovered.label}
          </text>
          <text x={tooltipX + TOOLTIP_WIDTH / 2} y={tooltipY + 26} fontSize="12" fontWeight="600" textAnchor="middle" fill="#FFFFFF">
            {formatValue(hovered.value)}
          </text>
        </g>
      ) : null}

      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="transparent" onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)} />
    </svg>
  );
}
