import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collectionService } from '@/services/collectionService';
import { ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import type { Collection } from '@/types/domain';

/** Public index of published collections — seasonal drops and curated edits. */
export function Collections() {
  const [collections, setCollections] = useState<Collection[] | null>(null);

  useDocumentHead({
    title: 'Collections',
    description: 'Seasonal collections and special drops from X-Rare.',
    path: '/collections',
  });

  useEffect(() => {
    collectionService.list().then(setCollections);
  }, []);

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-6 py-[var(--spacing-section-mobile)] lg:px-8 lg:py-[var(--spacing-section-desktop)]">
      <h1 className="text-xs font-semibold uppercase tracking-wide text-ink">Collections</h1>
      <p className="mt-2 max-w-md text-sm text-ink/60">Seasonal collections and special drops.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections === null
          ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="aspect-[4/5] w-full" />)
          : collections.map((collection) => (
              <Link
                key={collection.id}
                to={ROUTES.collection(collection.slug)}
                className="group relative block aspect-[4/5] overflow-hidden bg-surface-muted"
              >
                <img
                  src={collection.image ?? `https://picsum.photos/seed/xr-collection-${collection.slug}/800/1000`}
                  alt=""
                  width={800}
                  height={1000}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-ink/20" />
                <span className="absolute inset-x-0 bottom-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-surface">
                  {collection.title}
                </span>
              </Link>
            ))}
      </div>

      {collections && collections.length === 0 ? <p className="mt-8 text-sm text-ink/60">No collections available right now.</p> : null}
    </div>
  );
}
