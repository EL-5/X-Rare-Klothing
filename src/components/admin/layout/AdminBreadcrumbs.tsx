import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { adminRouteLabels } from '@/config/adminNavigation';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function labelFor(segment: string): string {
  if (segment === 'new') return 'New';
  if (UUID_PATTERN.test(segment)) return 'Detail';
  return adminRouteLabels[segment] ?? segment.replace(/-/g, ' ');
}

export function AdminBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, index) => ({
    label: labelFor(segment),
    href: '/' + segments.slice(0, index + 1).join('/'),
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" /> : null}
          {index === crumbs.length - 1 ? (
            <span className="font-medium text-slate-900">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="hover:text-slate-700">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
