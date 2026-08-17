import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInformation } from '@/components/product/ProductInformation';
import { VariantSelector } from '@/components/product/VariantSelector';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { AddToCart } from '@/components/product/AddToCart';
import { ProductDetailsSection } from '@/components/product/ProductDetailsSection';
import { ShippingReturnsSection } from '@/components/product/ShippingReturnsSection';
import { SizeGuideSection } from '@/components/product/SizeGuideSection';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { Reviews } from '@/components/product/Reviews';
import { NotFound } from '@/pages/NotFound';
import { useVariantSelection } from '@/hooks/useVariantSelection';
import { productService } from '@/services/productService';
import { inventoryService } from '@/services/inventoryService';
import { analyticsService } from '@/services/analyticsService';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { useStructuredData } from '@/hooks/useStructuredData';
import { ROUTES } from '@/config/routes';
import type { InventoryLevel, Product } from '@/types/domain';

export function ProductDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [inventoryByVariant, setInventoryByVariant] = useState<Map<string, InventoryLevel>>(new Map());
  const [quantity, setQuantity] = useState(1);

  const selection = useVariantSelection(product ?? null);
  const { activeVariant } = selection;

  useEffect(() => {
    let cancelled = false;
    setProduct(undefined);
    productService.getBySlug(slug).then(async (result) => {
      if (cancelled) return;
      setProduct(result);
      if (result) {
        const variantIds = result.variants.map((v) => v.id);
        const levels = await inventoryService.getAvailabilityForVariants(variantIds);
        if (!cancelled) setInventoryByVariant(new Map(levels.map((l) => [l.variantId, l])));
        void analyticsService.trackProductView(result.id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    setQuantity(1);
  }, [activeVariant?.id]);

  const activeInventoryForHead = activeVariant ? inventoryByVariant.get(activeVariant.id) : undefined;

  useDocumentHead({
    title: product ? product.title : 'Product',
    description: product?.description
      ? product.description.slice(0, 160)
      : 'Shop rare, design-led pieces from X-Rare.',
    path: ROUTES.product(slug),
    image: product?.images[0],
    type: 'product',
  });

  useStructuredData(
    product
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description ?? undefined,
            image: product.images,
            sku: activeVariant?.sku ?? undefined,
            brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
            offers: {
              '@type': 'Offer',
              url: `${window.location.origin}${ROUTES.product(slug)}`,
              priceCurrency: (activeVariant?.price ?? product.price).currency,
              price: ((activeVariant?.price ?? product.price).cents / 100).toFixed(2),
              availability:
                activeInventoryForHead === undefined || activeInventoryForHead.available > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${window.location.origin}${ROUTES.home}` },
              { '@type': 'ListItem', position: 2, name: 'Shop', item: `${window.location.origin}${ROUTES.shop}` },
              {
                '@type': 'ListItem',
                position: 3,
                name: product.title,
                item: `${window.location.origin}${ROUTES.product(slug)}`,
              },
            ],
          },
        ]
      : null,
  );

  if (product === undefined) {
    return <div className="mx-auto max-w-[var(--container-max)] px-6 py-24 lg:px-8" />;
  }

  if (product === null) {
    return <NotFound />;
  }

  const activeInventory = activeVariant ? inventoryByVariant.get(activeVariant.id) : undefined;

  return (
    <div>
      <div className="mx-auto max-w-[var(--container-max)] px-6 py-10 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink/60">
          <Link to={ROUTES.home} className="hover:text-ink">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to={ROUTES.shop} className="hover:text-ink">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} title={product.title} activeImageUrl={activeVariant?.image ?? null} />

          <div className="flex flex-col gap-6">
            <ProductInformation
              product={product}
              price={activeVariant?.price ?? product.price}
              compareAtPrice={activeVariant?.compareAtPrice ?? product.compareAtPrice}
              sku={activeVariant?.sku ?? null}
            />

            <VariantSelector selection={selection} />

            {activeVariant ? (
              activeInventory ? (
                <p className={`text-xs ${activeInventory.available > 0 ? 'text-success' : 'text-danger'}`}>
                  {activeInventory.available > 0
                    ? activeInventory.available <= activeInventory.lowStockThreshold
                      ? `Only ${activeInventory.available} left in stock`
                      : 'In stock'
                    : 'Out of stock'}
                </p>
              ) : null
            ) : (
              <p className="text-xs text-danger">This combination is unavailable. Please choose another option.</p>
            )}

            <QuantitySelector quantity={quantity} onChange={setQuantity} max={activeInventory?.available} />

            <AddToCart product={product} variant={activeVariant} quantity={quantity} availableQuantity={activeInventory?.available} />

            <div>
              <ProductDetailsSection description={product.description} />
              <ShippingReturnsSection />
              <SizeGuideSection />
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts product={product} />
      <Reviews productId={product.id} />
    </div>
  );
}
