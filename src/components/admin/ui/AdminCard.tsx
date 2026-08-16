import type { HTMLAttributes } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface AdminCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  /** Position in a repeated list (Reviews, FAQs, Contact Submissions, Homepage sections all render one AdminCard per item) — drives the stagger delay on first render. Omit for a standalone card. */
  index?: number;
}

export function AdminCard({ className, index = 0, ...props }: AdminCardProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : Math.min(index, 20) * 0.03 }}
      className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    />
  );
}

export function AdminCardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-slate-200 px-5 py-4', className)} {...props} />;
}

export function AdminCardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />;
}
