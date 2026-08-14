import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '@/services/productService';
import { collectionService } from '@/services/collectionService';
import { inventoryService } from '@/services/inventoryService';
import type { Product } from '@/types/domain';

export type SortValue = 'featured' | 'newest' | 'price-ascending' | 'price-descending' | 'best-selling';

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-ascending', label: 'Price: Low to High' },
  { value: 'price-descending', label: 'Price: High to Low' },
  { value: 'best-selling', label: 'Best Selling' },
];

export interface ProductListingScope {
  collectionSlug?: string;
  categorySlug?: string;
}

export interface ProductListingFacets {
  priceMinCents: number;
  priceMaxCents: number;
  sizes: string[];
  colors: string[];
}

const PAGE_SIZE = 8;

function parseList(value: string | null): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

/**
 * Backs /shop, /collections/:slug, and /category/:slug. Fetches the raw
 * scoped catalog once (large page size — the store is small enough that
 * server-side price/size/color faceting isn't worth the query complexity
 * yet, see docs/database.md's client-side-aggregation precedent), then
 * applies availability/price/size/color filtering, sorting, and "Load more"
 * pagination client-side. Filters and sort are mirrored in the URL so a
 * refresh reproduces the same view.
 */
export function useProductListing(scope: ProductListingScope) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rawProducts, setRawProducts] = useState<Product[] | null>(null);
  const [inStockVariantIds, setInStockVariantIds] = useState<Set<string> | null>(null);
  const [salesCounts, setSalesCounts] = useState<Map<string, number> | null>(null);
  const [featuredPositions, setFeaturedPositions] = useState<Map<string, number> | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sort = (searchParams.get('sort') as SortValue) || 'featured';
  const availabilityOnly = searchParams.get('availability') === 'in-stock';
  const priceMinParam = searchParams.get('price_min');
  const priceMaxParam = searchParams.get('price_max');
  const sizeParam = searchParams.get('size');
  const colorParam = searchParams.get('color');
  const selectedSizes = parseList(sizeParam);
  const selectedColors = parseList(colorParam);

  /** On an unscoped route (/shop) these fall back to ?category=/?collection= so the filter panel can narrow without leaving the page; a route-level scope (/collections/:slug, /category/:slug) always wins. */
  const effectiveCollectionSlug = scope.collectionSlug ?? searchParams.get('collection') ?? undefined;
  const effectiveCategorySlug = scope.categorySlug ?? searchParams.get('category') ?? undefined;
  const isRouteScoped = Boolean(scope.collectionSlug || scope.categorySlug);

  useEffect(() => {
    let cancelled = false;
    setRawProducts(null);
    setInStockVariantIds(null);
    setFeaturedPositions(effectiveCollectionSlug ? null : new Map());

    productService.list({ collectionSlug: effectiveCollectionSlug, categorySlug: effectiveCategorySlug, pageSize: 200 }).then(async (result) => {
      if (cancelled) return;
      setRawProducts(result.items);

      const variantIds = result.items.flatMap((p) => p.variants.map((v) => v.id));
      const levelsPromise =
        variantIds.length > 0 ? inventoryService.getAvailabilityForVariants(variantIds) : Promise.resolve([]);

      const positionsPromise = effectiveCollectionSlug
        ? collectionService.getBySlug(effectiveCollectionSlug).then((collection) =>
            collection ? collectionService.listAssignedProducts(collection.id) : [],
          )
        : Promise.resolve([]);

      const [levels, assigned] = await Promise.all([levelsPromise, positionsPromise]);
      if (cancelled) return;

      setInStockVariantIds(new Set(levels.filter((l) => l.available > 0).map((l) => l.variantId)));
      if (effectiveCollectionSlug) {
        setFeaturedPositions(new Map(assigned.map((a) => [a.productId, a.position])));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [effectiveCollectionSlug, effectiveCategorySlug]);

  useEffect(() => {
    if (sort !== 'best-selling' || salesCounts !== null) return;
    let cancelled = false;
    productService.getSalesCounts().then((counts) => {
      if (!cancelled) setSalesCounts(counts);
    });
    return () => {
      cancelled = true;
    };
  }, [sort, salesCounts]);

  const facets = useMemo<ProductListingFacets | null>(() => {
    if (!rawProducts) return null;
    const prices = rawProducts.map((p) => p.price.cents);
    const sizes = Array.from(new Set(rawProducts.flatMap((p) => p.variants.map((v) => v.size).filter((s): s is string => Boolean(s)))));
    const colors = Array.from(new Set(rawProducts.flatMap((p) => p.variants.map((v) => v.color).filter((c): c is string => Boolean(c)))));
    return {
      priceMinCents: prices.length ? Math.min(...prices) : 0,
      priceMaxCents: prices.length ? Math.max(...prices) : 0,
      sizes: sizes.sort(),
      colors: colors.sort(),
    };
  }, [rawProducts]);

  const filteredSorted = useMemo(() => {
    if (!rawProducts || !inStockVariantIds) return null;

    let items = rawProducts;

    if (availabilityOnly) {
      items = items.filter((p) => p.variants.some((v) => inStockVariantIds.has(v.id)));
    }
    if (priceMinParam) {
      const minCents = Math.round(Number(priceMinParam) * 100);
      items = items.filter((p) => p.price.cents >= minCents);
    }
    if (priceMaxParam) {
      const maxCents = Math.round(Number(priceMaxParam) * 100);
      items = items.filter((p) => p.price.cents <= maxCents);
    }
    if (selectedSizes.length > 0) {
      items = items.filter((p) => p.variants.some((v) => v.size && selectedSizes.includes(v.size)));
    }
    if (selectedColors.length > 0) {
      items = items.filter((p) => p.variants.some((v) => v.color && selectedColors.includes(v.color)));
    }

    const sorted = [...items];
    switch (sort) {
      case 'price-ascending':
        sorted.sort((a, b) => a.price.cents - b.price.cents);
        break;
      case 'price-descending':
        sorted.sort((a, b) => b.price.cents - a.price.cents);
        break;
      case 'best-selling':
        if (salesCounts) sorted.sort((a, b) => (salesCounts.get(b.id) ?? 0) - (salesCounts.get(a.id) ?? 0));
        break;
      case 'featured':
        if (featuredPositions && featuredPositions.size > 0) {
          sorted.sort((a, b) => (featuredPositions.get(a.id) ?? Infinity) - (featuredPositions.get(b.id) ?? Infinity));
        }
        break;
      case 'newest':
      default:
        // Server already returns newest-first for an unscoped/category list; collection order falls back to it too.
        break;
    }
    return sorted;
  }, [rawProducts, inStockVariantIds, availabilityOnly, priceMinParam, priceMaxParam, selectedSizes, selectedColors, sort, salesCounts, featuredPositions]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [effectiveCollectionSlug, effectiveCategorySlug, sort, availabilityOnly, priceMinParam, priceMaxParam, sizeParam, colorParam]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleListParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const current = parseList(next.get(key));
          const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
          if (updated.length === 0) next.delete(key);
          else next.set(key, updated.join(','));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const keys = ['availability', 'price_min', 'price_max', 'size', 'color'];
        if (!isRouteScoped) keys.push('category', 'collection');
        for (const key of keys) next.delete(key);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams, isRouteScoped]);

  const activeFilterCount =
    (availabilityOnly ? 1 : 0) +
    (priceMinParam ? 1 : 0) +
    (priceMaxParam ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    (!isRouteScoped && (searchParams.get('category') || searchParams.get('collection')) ? 1 : 0);

  const isProductInStock = (product: Product): boolean =>
    inStockVariantIds ? product.variants.some((v) => inStockVariantIds.has(v.id)) : true;

  return {
    isLoading: filteredSorted === null,
    items: filteredSorted?.slice(0, visibleCount) ?? [],
    isProductInStock,
    totalCount: filteredSorted?.length ?? 0,
    hasMore: (filteredSorted?.length ?? 0) > visibleCount,
    loadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
    facets,
    sort,
    setSort: (value: SortValue) => updateParam('sort', value === 'featured' ? null : value),
    availabilityOnly,
    toggleAvailability: () => updateParam('availability', availabilityOnly ? null : 'in-stock'),
    priceMin: priceMinParam,
    priceMax: priceMaxParam,
    setPriceRange: (min: string | null, max: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (min) next.set('price_min', min);
          else next.delete('price_min');
          if (max) next.set('price_max', max);
          else next.delete('price_max');
          return next;
        },
        { replace: true },
      );
    },
    selectedSizes,
    toggleSize: (size: string) => toggleListParam('size', size),
    selectedColors,
    toggleColor: (color: string) => toggleListParam('color', color),
    clearFilters,
    activeFilterCount,
    /** Category/collection quick-filters — only meaningful (and only rendered) on the unscoped /shop route. */
    isRouteScoped,
    selectedCategory: isRouteScoped ? null : searchParams.get('category'),
    setCategory: (slug: string | null) => updateParam('category', slug),
    selectedCollection: isRouteScoped ? null : searchParams.get('collection'),
    setCollection: (slug: string | null) => updateParam('collection', slug),
  };
}
