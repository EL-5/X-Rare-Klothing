import { useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ChartPoint } from '@/services/dashboardService';

export interface LineChartProps {
  data: ChartPoint[];
  formatValue?: (value: number) => string;
  color?: string;
}

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 24, left: 12 };
const TOOLTIP_WIDTH = 110;
const TOOLTIP_HEIGHT = 34;

/** Minimal hand-rolled SVG line chart — no charting library dependency for a handful of simple time series. */
export function LineChart({ data, formatValue = (v) => String(v), color = '#4F46E5' }: LineChartProps) {
  const prefersReducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No data</div>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = PADDING.left + stepX * i;
    const y = PADDING.top + innerHeight - (d.value / max) * innerHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]!.x.toFixed(1)} ${PADDING.top + innerHeight} L ${points[0]!.x.toFixed(1)} ${PADDING.top + innerHeight} Z`;

  // Show at most ~6 x-axis labels to avoid crowding.
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  const handleMove = (event: ReactMouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const local = pt.matrixTransform(ctm.inverse());

    let nearest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - local.x);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipX = hovered ? Math.min(Math.max(hovered.x - TOOLTIP_WIDTH / 2, 4), WIDTH - TOOLTIP_WIDTH - 4) : 0;
  const tooltipY = hovered ? Math.max(hovered.y - TOOLTIP_HEIGHT - 10, 2) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full overflow-visible"
      role="img"
      aria-label="Line chart"
    >
      <defs>
        <linearGradient id="lineChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d={areaPath}
        fill="url(#lineChartFill)"
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={prefersReducedMotion ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />

      {points.map((p, i) => (
        <motion.g
          key={i}
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <circle cx={p.x} cy={p.y} r={hoverIndex === i ? 4.5 : 2.5} fill={color} className="transition-[r] duration-150" />
          {i % labelEvery === 0 ? (
            <text x={p.x} y={HEIGHT - 6} fontSize="9" textAnchor="middle" fill="#94A3B8">
              {p.label.slice(5)}
            </text>
          ) : null}
        </motion.g>
      ))}

      {hovered ? (
        <g pointerEvents="none">
          <line x1={hovered.x} y1={PADDING.top} x2={hovered.x} y2={PADDING.top + innerHeight} stroke={color} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={hovered.x} cy={hovered.y} r="6" fill={color} fillOpacity="0.18" />
          <rect x={tooltipX} y={tooltipY} width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} rx="6" fill="#0F172A" />
          <text x={tooltipX + TOOLTIP_WIDTH / 2} y={tooltipY + 14} fontSize="9" textAnchor="middle" fill="#94A3B8">
            {hovered.label}
          </text>
          <text x={tooltipX + TOOLTIP_WIDTH / 2} y={tooltipY + 26} fontSize="12" fontWeight="600" textAnchor="middle" fill="#FFFFFF">
            {formatValue(hovered.value)}
          </text>
        </g>
      ) : null}

      {/* Transparent full-area hit target on top, so the tooltip snaps to the nearest point from anywhere in the chart, not just exactly on a dot. */}
      <rect
        x={0}
        y={0}
        width={WIDTH}
        height={HEIGHT}
        fill="transparent"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      />
    </svg>
  );
}
