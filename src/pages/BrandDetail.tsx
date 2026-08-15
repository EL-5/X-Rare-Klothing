import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProductListing } from '@/hooks/useProductListing';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { QuickViewDrawer } from '@/components/product/QuickViewDrawer';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { brandService } from '@/services/brandService';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { ROUTES } from '@/config/routes';
import type { Brand } from '@/types/domain';
import type { Product } from '@/types/domain';

/** A brand's own storefront within X-Rare — hero, story, and its product catalog, reusing the same grid/pagination shell as /shop. */
export function BrandDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [brand, setBrand] = useState<Brand | null | undefined>(undefined);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const listing = useProductListing({ brandSlug: slug });

  useEffect(() => {
    brandService.getBySlug(slug).then(setBrand);
  }, [slug]);

  useDocumentHead({
    title: brand ? brand.name : 'Brand',
    description: brand?.description ?? `Shop ${slug} at X-Rare.`,
    path: ROUTES.brand(slug),
  });

  if (brand === undefined) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (brand === null) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold uppercase tracking-wide text-ink">Brand not found</h1>
        <Link to={ROUTES.brands} className="mt-4 inline-block text-sm text-ink underline-offset-2 hover:underline">
          Back to Brands
        </Link>
      </div>
    );
  }

  return (
    <div>
      {brand.coverImage ? (
        <div className="relative h-[280px] w-full overflow-hidden bg-ink lg:h-[380px]">
          <OptimizedImage src={brand.coverImage} alt="" width={2000} height={760} containerClassName="h-full w-full" loading="eager" />
          <div className="absolute inset-0 bg-ink/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <h1 className="text-3xl font-semibold uppercase tracking-tight text-surface sm:text-5xl">{brand.name}</h1>
            {brand.country ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-surface/80">{brand.country}</p> : null}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[var(--container-max)] px-6 pt-12 lg:px-8">
          <h1 className="text-3xl font-semibold uppercase tracking-tight text-ink sm:text-5xl">{brand.name}</h1>
          {brand.country ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">{brand.country}</p> : null}
        </div>
      )}

      {brand.description ? (
        <div className="mx-auto max-w-2xl px-6 py-10 text-center lg:px-8">
          <p className="text-sm leading-relaxed text-ink/70">{brand.description}</p>
        </div>
      ) : null}

      <div className="mx-auto max-w-[var(--container-max)] px-6 pb-16 lg:px-8 lg:pb-24">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            {listing.isLoading ? 'Loading…' : `${listing.totalCount} product${listing.totalCount === 1 ? '' : 's'}`}
          </h2>
        </div>

        <ProductGrid products={listing.isLoading ? null : listing.items} isProductInStock={listing.isProductInStock} onQuickView={setQuickViewProduct} />
      </div>

      <QuickViewDrawer product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
