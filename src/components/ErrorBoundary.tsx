import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Without this, an uncaught render error anywhere in the tree unmounts the
 * whole app to a blank white screen — React error boundaries have no hook
 * equivalent, so this has to be a class component. Logs to console (the
 * only "monitoring" this environment has); swap the console.error for a
 * real error-tracking SDK call once one is wired up in production.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-lg font-semibold uppercase tracking-wide text-ink">Something went wrong</h1>
          <p className="max-w-sm text-sm text-ink/60">
            We hit an unexpected error. Please try reloading the page — if it keeps happening, contact support.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 border border-ink px-6 text-xs uppercase tracking-wide text-ink hover:bg-ink hover:text-surface"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
