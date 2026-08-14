import { useEffect, useMemo, useState } from 'react';
import type { Product, ProductVariant } from '@/types/domain';

function uniqueNonNull(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}

/**
 * Resolves Color/Size selections to a real ProductVariant — shared by the
 * PDP and QuickViewDrawer so "selecting a variant" means the same thing in
 * both places (see Batch 9: "must resolve to a real product variant").
 * Selectors for a dimension only render when it actually varies across the
 * product's variants (e.g. a single-variant product shows neither).
 */
export function useVariantSelection(product: Product | null) {
  const colorOptions = useMemo(
    () => (product ? uniqueNonNull(product.variants.map((v) => v.color)) : []),
    [product],
  );
  const sizeOptions = useMemo(
    () => (product ? uniqueNonNull(product.variants.map((v) => v.size)) : []),
    [product],
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    setSelectedColor(colorOptions[0] ?? null);
    setSelectedSize(sizeOptions[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const activeVariant: ProductVariant | null =
    product?.variants.find(
      (v) => (colorOptions.length === 0 || v.color === selectedColor) && (sizeOptions.length === 0 || v.size === selectedSize),
    ) ?? null;

  return { colorOptions, sizeOptions, selectedColor, setSelectedColor, selectedSize, setSelectedSize, activeVariant };
}
