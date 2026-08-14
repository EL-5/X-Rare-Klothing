import type { ReactNode } from 'react';
import { useDocumentHead } from '@/hooks/useDocumentHead';

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  useDocumentHead({ title, path: window.location.pathname, noindex: true });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold uppercase tracking-wide text-ink">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-ink/60">{subtitle}</p> : null}
      <div className="mt-8">{children}</div>
      {footer ? <div className="mt-6 text-sm text-ink/60">{footer}</div> : null}
    </div>
  );
}
