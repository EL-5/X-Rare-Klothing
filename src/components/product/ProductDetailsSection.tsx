import { Accordion } from '@/components/ui/Accordion';

export interface ProductDetailsSectionProps {
  description: string | null;
}

/** Open-by-default per the reference's text order (see docs/component-inventory.md). */
export function ProductDetailsSection({ description }: ProductDetailsSectionProps) {
  return (
    <Accordion title="Product Details" defaultOpen>
      {description ? <p className="whitespace-pre-line">{description}</p> : <p>No additional details available.</p>}
    </Accordion>
  );
}
