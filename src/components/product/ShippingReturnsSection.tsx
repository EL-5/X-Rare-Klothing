import { Accordion } from '@/components/ui/Accordion';

export function ShippingReturnsSection() {
  return (
    <Accordion title="Shipping and Returns">
      <p>Free standard shipping on orders over $200. Orders ship within 1–2 business days.</p>
      <p className="mt-2">Returns accepted within 14 days of delivery. Items must be unworn with original tags attached.</p>
    </Accordion>
  );
}
