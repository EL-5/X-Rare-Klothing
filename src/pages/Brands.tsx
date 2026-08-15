import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { brandService } from '@/services/brandService';
import { liberianImages, unsplashUrl } from '@/data/images';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { ROUTES } from '@/config/routes';
import type { Brand } from '@/types/domain';

/** THE BRANDS — the multi-brand directory. Only real, admin-configured brands ever appear here; with one house brand currently onboarded, the page says so honestly rather than padding itself with invented labels. */
export function Brands() {
  const [brands, setBrands] = useState<Brand[] | null>(null);

  useDocumentHead({
    title: 'Brands',
    description: 'A curated selection of labels, designers and names worth knowing — X-Rare and the brands we carry.',
    path: '/brands',
  });

  useEffect(() => {
    brandService.listPublished().then(setBrands);
  }, []);

  const featured = brands?.filter((b) => b.isFeatured) ?? [];
  const rest = brands?.filter((b) => !b.isFeatured) ?? [];

  return (
    <div>
      <div className="relative h-[38vh] min-h-[280px] w-full overflow-hidden bg-ink">
        <OptimizedImage
          src={unsplashUrl(liberianImages.brandsHero.id, { w: 2400, h: 1400 })}
          alt={liberianImages.brandsHero.alt}
          width={2400}
          height={1400}
          containerClassName="h-full w-full"
          className="opacity-80"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-semibold uppercase tracking-tight text-surface sm:text-5xl">The Brands.</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-surface/85">
            A curated selection of labels, designers and names worth knowing.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--container-max)] px-6 py-14 lg:px-8 lg:py-20">
        {brands === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full" />
            ))}
          </div>
        ) : (
          <>
            {featured.length > 0 ? (
              <section className="mb-14">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Featured Brands</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((brand) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>
              </section>
            ) : null}

            {rest.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">All Brands</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((brand) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>
              </section>
            ) : null}

            {brands.length <= 1 ? (
              <p className="mt-10 max-w-md text-sm leading-relaxed text-ink/60">
                We're just getting started as a multi-brand destination — right now X-Rare is the only label onboarded.
                More curated brands, designers and labels are coming as they're authorized to sell on X-Rare.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link to={ROUTES.brand(brand.slug)} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        {brand.coverImage ? (
          <OptimizedImage
            src={brand.coverImage}
            alt=""
            width={800}
            height={1000}
            containerClassName="h-full w-full"
            className="transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink">
            <span className="text-2xl font-semibold uppercase tracking-wide text-surface">{brand.name}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-surface">{brand.name}</p>
          <p className="mt-0.5 text-xs text-surface/75">
            {brand.country ? `${brand.country} · ` : ''}
            {brand.productCount} product{brand.productCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </Link>
  );
}
