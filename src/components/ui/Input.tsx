import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Class names for the outer wrapper (e.g. grid col-span) — `className` targets the `<input>` itself. */
  containerClassName?: string;
  /** 'light' (default) for the usual white/surface forms; 'dark' for placement on a dark background (e.g. the footer) — a real variant instead of fighting the light-theme classes via `className`, since plain string-concat `cn()` has no override semantics. */
  tone?: 'light' | 'dark';
}

const toneClassNames: Record<'light' | 'dark', string> = {
  light: 'border-border bg-surface text-ink placeholder:text-ink/60 focus:border-ink',
  dark: 'border-footer-foreground/30 bg-transparent text-footer-foreground placeholder:text-footer-foreground/50 focus:border-footer-foreground',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className, containerClassName, tone = 'light', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 w-full rounded-[var(--radius-input)] border px-4 text-sm',
          'transition-colors duration-[var(--duration-base)] focus:outline-none',
          toneClassNames[tone],
          error ? 'border-danger' : null,
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
