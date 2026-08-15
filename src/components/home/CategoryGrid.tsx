import { useEffect, useState } from 'react';
import { categoryService } from '@/services/categoryService';
import { Skeleton } from '@/components/ui/Skeleton';
import { CategoryCard } from './CategoryCard';
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
              <CategoryCard key={category.id} name={category.name} slug={category.slug} image={category.image} description={category.description} />
            ))}
      </div>
    </section>
  );
}
