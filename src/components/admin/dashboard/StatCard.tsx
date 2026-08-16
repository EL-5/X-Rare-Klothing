import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'danger';
  /** % change vs. the immediately preceding period of equal length. undefined = not applicable to this metric, null = no baseline to compare against (previous period was zero). */
  deltaPercent?: number | null;
  /** Stagger position for the entrance animation. */
  index?: number;
}

export function StatCard({ label, value, icon: Icon, tone = 'default', deltaPercent, index = 0 }: StatCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const hasDelta = deltaPercent !== undefined;
  const isUp = typeof deltaPercent === 'number' && deltaPercent > 0;
  const isDown = typeof deltaPercent === 'number' && deltaPercent < 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: prefersReducedMotion ? 0 : index * 0.04, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <Icon
          className={cn(
            'h-4 w-4',
            tone === 'danger' ? 'text-red-500' : tone === 'warning' ? 'text-amber-500' : 'text-slate-400',
          )}
          aria-hidden="true"
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={value}
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'mt-2 text-2xl font-semibold',
            tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-slate-900',
          )}
        >
          {value}
        </motion.p>
      </AnimatePresence>
      {hasDelta ? (
        <p
          className={cn(
            'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
            isUp ? 'text-emerald-600' : isDown ? 'text-red-600' : 'text-slate-400',
          )}
        >
          {deltaPercent === null ? (
            'No prior data'
          ) : (
            <>
              {isUp ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : isDown ? <TrendingDown className="h-3 w-3" aria-hidden="true" /> : null}
              {`${isUp ? '+' : ''}${deltaPercent.toFixed(1)}%`}
              <span className="font-normal text-slate-400">vs. prior period</span>
            </>
          )}
        </p>
      ) : null}
    </motion.div>
  );
}
