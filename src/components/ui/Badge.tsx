import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'sale' | 'sold-out' | 'neutral' | 'success';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClassNames: Record<BadgeVariant, string> = {
  sale: 'bg-badge-sale text-surface',
  'sold-out': 'bg-badge-sold-out text-surface',
  neutral: 'bg-surface-muted text-ink',
  success: 'bg-success text-surface',
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-badge)] px-2 py-1 text-xs font-semibold uppercase tracking-wide',
        variantClassNames[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
