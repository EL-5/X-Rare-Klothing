import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ROUTES } from '@/config/routes';

export interface CategoryCardProps {
  name: string;
  slug: string;
  image: string | null;
  description?: string | null;
}

/** Reusable category tile: image with hover zoom + overlay, name, optional description. Mobile relies on tap, not hover. */
export function CategoryCard({ name, slug, image, description }: CategoryCardProps) {
  return (
    <Link to={ROUTES.category(slug)} className="group relative block aspect-[4/5] overflow-hidden bg-surface-muted">
      {image ? (
        <OptimizedImage
          src={image}
          alt=""
          width={800}
          height={1000}
          containerClassName="h-full w-full"
          className="transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent transition-opacity duration-[var(--duration-base)] group-hover:from-ink/60" />
      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 px-4 text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-surface">{name}</span>
        {description ? (
          <span className="max-w-[85%] text-xs text-surface/80 opacity-0 transition-opacity duration-[var(--duration-base)] group-hover:opacity-100">
            {description}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
