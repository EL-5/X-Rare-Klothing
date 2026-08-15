import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useProductListing } from '@/hooks/useProductListing';
import { useDisclosure } from '@/hooks/useDisclosure';
import { FilterPanel } from '@/components/shop/FilterPanel';
import { FilterDrawer } from '@/components/shop/FilterDrawer';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { SortDropdown } from '@/components/shop/SortDropdown';
import { QuickViewDrawer } from '@/components/product/QuickViewDrawer';
import { Button } from '@/components/ui/Button';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { collectionService } from '@/services/collectionService';
import { categoryService } from '@/services/categoryService';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { ROUTES } from '@/config/routes';
import type { Product } from '@/types/domain';

export type ShopScope = 'shop' | 'collection' | 'category';

export interface ShopProps {
  scope: ShopScope;
}

/** Backs /shop, /collections/:slug, and /category/:slug — same grid/filter/sort/pagination shell, different data scope. */
export function Shop({ scope }: ShopProps) {
  const { slug = '' } = useParams<{ slug: string }>();
  const [title, setTitle] = useState<string | null>(scope === 'shop' ? 'Shop' : null);
  const [description, setDescription] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const filterDrawer = useDisclosure();

  const listing = useProductListing({
    collectionSlug: scope === 'collection' ? slug : undefined,
    categorySlug: scope === 'category' ? slug : undefined,
  });

  useEffect(() => {
    if (scope === 'collection') {
      collectionService.getBySlug(slug).then((collection) => {
        setTitle(collection?.title ?? 'Collection');
        setDescription(collection?.description ?? null);
        setCoverImage(collection?.image ?? null);
      });
    } else if (scope === 'category') {
      categoryService.list().then((categories) => {
        const category = categories.find((c) => c.slug === slug);
        setTitle(category?.name ?? 'Category');
        setDescription(category?.description ?? null);
        setCoverImage(category?.image ?? null);
      });
    }
  }, [scope, slug]);

  const path = scope === 'collection' ? ROUTES.collection(slug) : scope === 'category' ? ROUTES.category(slug) : ROUTES.shop;
  useDocumentHead({
    title: title ?? 'Shop',
    description: description ?? 'Shop the full X-Rare range — new arrivals, collections, and accessories.',
    path,
  });

  return (
    <div>
      {coverImage ? (
        <div className="relative h-[220px] w-full overflow-hidden bg-surface-muted lg:h-[320px]">
          <OptimizedImage src={coverImage} alt="" width={2000} height={640} containerClassName="h-full w-full" loading="eager" />
          <div className="absolute inset-0 bg-ink/30" />
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <h1 className="text-2xl font-semibold uppercase tracking-wide text-surface lg:text-4xl">{title}</h1>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[var(--container-max)] px-6 py-10 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink/60">
        <Link to={ROUTES.home} className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to={ROUTES.shop} className="hover:text-ink">
          Shop
        </Link>
        {scope !== 'shop' && title ? (
          <>
            <span className="mx-2">/</span>
            <span className="text-ink">{title}</span>
          </>
        ) : null}
      </nav>

      <div className="mb-8">
        {coverImage ? null : <h1 className="text-2xl font-semibold uppercase tracking-wide text-ink">{title ?? ' '}</h1>}
        {description ? <p className="mt-2 max-w-xl text-sm text-ink/60">{description}</p> : null}
      </div>

      <div className="flex gap-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <FilterPanel listing={listing} />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={filterDrawer.open}
                className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter{listing.activeFilterCount > 0 ? ` (${listing.activeFilterCount})` : ''}
              </button>
              <p className="text-xs text-ink/60">
                {listing.isLoading ? 'Loading…' : `${listing.totalCount} result${listing.totalCount === 1 ? '' : 's'}`}
              </p>
            </div>
            <SortDropdown value={listing.sort} onChange={listing.setSort} />
          </div>

          <ProductGrid products={listing.isLoading ? null : listing.items} isProductInStock={listing.isProductInStock} onQuickView={setQuickViewProduct} />

          {listing.hasMore ? (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" onClick={listing.loadMore}>
                Load More
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <FilterDrawer isOpen={filterDrawer.isOpen} onClose={filterDrawer.close} listing={listing} />
      <QuickViewDrawer product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      </div>
    </div>
  );
}
