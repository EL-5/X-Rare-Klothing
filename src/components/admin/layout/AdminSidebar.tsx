import { NavLink } from 'react-router-dom';
import { adminNavItems } from '@/config/adminNavigation';
import { useAuth } from '@/stores/AuthStore';
import { cn } from '@/lib/cn';

export interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const { hasAnyRole } = useAuth();

  return (
    <nav className={cn('flex h-full flex-col bg-slate-900 text-slate-300', className)} aria-label="Admin">
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
          XR
        </div>
        <span className="text-sm font-semibold text-white">Operations</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {adminNavItems
            .filter((item) => !item.roles || hasAnyRole(...item.roles))
            .map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
        </ul>
      </div>
    </nav>
  );
}
