import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/about/Reveal';
import { resizeUnsplashUrl } from '@/data/images';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/cn';
import type { Collection } from '@/types/domain';

export interface CollectionShowcaseProps {
  collections: Collection[] | null;
  counts: Map<string, number>;
}

/** Alternating full-width image/text rows — one per real collection, mirroring the About page's StoryChapters treatment. */
export function CollectionShowcase({ collections, counts }: CollectionShowcaseProps) {
  if (collections === null) {
    return (
      <div className="mx-auto max-w-[var(--container-max)] px-6 lg:px-8">
        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-1 items-center gap-8 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className={cn('space-y-4', i % 2 === 1 ? 'lg:order-first' : null)}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-16 w-full max-w-sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="mx-auto max-w-[var(--container-max)] px-6 py-16 text-center lg:px-8">
        <p className="text-sm text-ink/60">No collections available right now.</p>
      </div>
    );
  }

  return (
    <div>
      {collections.map((collection, index) => {
        const imageFirst = index % 2 === 0;
        const count = counts.get(collection.id);

        return (
          <div
            key={collection.id}
            className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 items-center gap-8 border-t border-border px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24"
          >
            <Reveal className={cn(imageFirst ? 'lg:order-1' : 'lg:order-2')}>
              <Link to={ROUTES.collection(collection.slug)} className="group block aspect-[4/5] overflow-hidden bg-surface-muted">
                {collection.image ? (
                  <OptimizedImage
                    src={resizeUnsplashUrl(collection.image, { w: 1200, h: 1500 })}
                    alt=""
                    width={1200}
                    height={1500}
                    containerClassName="h-full w-full"
                    className="transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-105"
                  />
                ) : null}
              </Link>
            </Reveal>

            <Reveal delay={0.1} className={cn(imageFirst ? 'lg:order-2' : 'lg:order-1')}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {String(index + 1).padStart(2, '0')} — {count === undefined ? 'The Edit' : `${count} piece${count === 1 ? '' : 's'}`}
              </p>
              <h2 className="mt-4 text-3xl font-semibold uppercase leading-tight text-ink lg:text-5xl">{collection.title}</h2>
              {collection.description ? (
                <p className="mt-5 max-w-md text-base leading-relaxed text-ink/60">{collection.description}</p>
              ) : null}
              <Link
                to={ROUTES.collection(collection.slug)}
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink underline-offset-4 hover:underline"
              >
                Shop the Edit <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        );
      })}
    </div>
  );
}
