import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '@/services/categoryService';
import { ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Category } from '@/repositories/categoryRepository';

/** Top-level categories (Men/Women/Accessories), pulled live from the database rather than hardcoded. */
export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    categoryService.list().then((all) => setCategories(all.filter((c) => c.parentId === null)));
  }, []);

  if (categories && categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 py-[var(--spacing-section-mobile)] lg:px-8 lg:py-[var(--spacing-section-desktop)]">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-wide text-ink">Shop By Category</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {categories === null
          ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="aspect-[4/5] w-full" />)
          : categories.map((category) => (
              <Link key={category.id} to={ROUTES.category(category.slug)} className="group relative block aspect-[4/5] overflow-hidden bg-surface-muted">
                <img
                  src={category.image ?? `https://picsum.photos/seed/hf-category-${category.slug}/800/1000`}
                  alt=""
                  width={800}
                  height={1000}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-ink/20" />
                <span className="absolute inset-x-0 bottom-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-surface">
                  {category.name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
