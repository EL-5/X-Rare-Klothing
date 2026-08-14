import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type AdminBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const variantClassNames: Record<AdminBadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-indigo-100 text-indigo-700',
};

export interface AdminBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: AdminBadgeVariant;
}

export function AdminBadge({ variant = 'neutral', className, children, ...props }: AdminBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        variantClassNames[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
