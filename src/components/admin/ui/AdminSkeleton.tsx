import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function AdminSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} aria-hidden="true" {...props} />;
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <AdminSkeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
