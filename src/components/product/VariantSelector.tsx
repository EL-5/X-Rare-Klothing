import { ColorSelector } from './ColorSelector';
import { SizeSelector } from './SizeSelector';
import type { useVariantSelection } from '@/hooks/useVariantSelection';

export interface VariantSelectorProps {
  selection: ReturnType<typeof useVariantSelection>;
}

/** Composes Color + Size into one variant-resolution unit — see useVariantSelection for how selections resolve to a real ProductVariant. */
export function VariantSelector({ selection }: VariantSelectorProps) {
  const { colorOptions, selectedColor, setSelectedColor, sizeOptions, selectedSize, setSelectedSize } = selection;

  if (colorOptions.length === 0 && sizeOptions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <ColorSelector colors={colorOptions} selected={selectedColor} onChange={setSelectedColor} />
      <SizeSelector sizes={sizeOptions} selected={selectedSize} onChange={setSelectedSize} />
    </div>
  );
}
