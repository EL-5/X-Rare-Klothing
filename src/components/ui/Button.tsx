import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClassNames =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium uppercase ' +
  'tracking-[var(--tracking-button)] transition-colors duration-[var(--duration-base)] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-accent';

const variantClassNames: Record<ButtonVariant, string> = {
  solid: 'bg-ink text-surface hover:bg-ink/90',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-surface',
  ghost: 'text-ink hover:bg-surface-muted',
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-sm',
};

export function buttonClassNames({ variant = 'solid', size = 'md' }: ButtonVariantProps = {}, className?: string): string {
  return cn(baseClassNames, variantClassNames[variant], sizeClassNames[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'solid', size = 'md', isLoading = false, className, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClassNames({ variant, size }, className)}
      disabled={disabled ?? isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {children}
    </button>
  );
});
