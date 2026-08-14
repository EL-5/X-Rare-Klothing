import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'danger';
}

export function StatCard({ label, value, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <Icon
          className={cn(
            'h-4 w-4',
            tone === 'danger' ? 'text-red-500' : tone === 'warning' ? 'text-amber-500' : 'text-slate-400',
          )}
          aria-hidden="true"
        />
      </div>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold',
          tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  );
}
