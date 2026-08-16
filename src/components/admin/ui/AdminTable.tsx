import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

/** Card wrapper for a table — put <AdminTable> and, optionally, <AdminPagination> inside this (not inside the table itself; a <div> footer isn't valid table markup). */
export function AdminTableCard({ children, className }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}
    >
      {children}
    </motion.div>
  );
}

export function AdminTable({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  );
}

export function AdminTHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-slate-50', className)} {...props} />;
}

export function AdminTh({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500', className)}
      {...props}
    />
  );
}

export function AdminTBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-slate-100', className)} {...props} />;
}

export interface AdminTrProps extends Omit<HTMLAttributes<HTMLTableRowElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  /** Row position — drives the stagger delay on first render. Omit for rows that don't need staggering (e.g. a single-row table). */
  index?: number;
}

export function AdminTr({ className, index = 0, ...props }: AdminTrProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.tr
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: prefersReducedMotion ? 0 : Math.min(index, 20) * 0.02 }}
      className={cn('hover:bg-slate-50', className)}
      {...props}
    />
  );
}

export function AdminTd({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-slate-700', className)} {...props} />;
}
