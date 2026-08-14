import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export function NotFound() {
  return (
    <div className="mx-auto max-w-[var(--container-max)] px-6 py-24 text-center lg:px-8">
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <Link to={ROUTES.home} className="mt-4 inline-block text-sm underline-offset-2 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
