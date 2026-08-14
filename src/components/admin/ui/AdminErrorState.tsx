import { AdminButton } from './AdminButton';

export interface AdminErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function AdminErrorState({ message, onRetry }: AdminErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 py-16 text-center">
      <p className="text-sm font-medium text-red-700">Something went wrong</p>
      {message ? <p className="mt-1 max-w-sm text-sm text-red-600">{message}</p> : null}
      {onRetry ? (
        <AdminButton variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </AdminButton>
      ) : null}
    </div>
  );
}
