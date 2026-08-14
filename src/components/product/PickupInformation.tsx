import { useState } from 'react';
import { MapPin } from 'lucide-react';

/**
 * Mirrors the reference's native Shopify "pickup availability" block — the
 * physical store, "usually ready in 1 hour", expandable store info (see
 * docs/component-inventory.md: "PickupAvailability"). We have no real store
 * locations table, so this is static informational content, same as the
 * reference's own merchant-configured copy.
 */
export function PickupInformation() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border p-4">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" />
        <div>
          <p className="text-sm font-medium text-ink">Pickup available at X-Rare Flagship Store</p>
          <p className="mt-0.5 text-xs text-ink/60">Usually ready in 1 hour</p>
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="mt-2 text-xs uppercase tracking-wide text-ink underline-offset-2 hover:underline"
          >
            {isExpanded ? 'Hide store information' : 'View store information'}
          </button>
          {isExpanded ? (
            <div className="mt-3 text-xs text-ink/70">
              <p>123 Fashion Avenue, New York, NY 10001</p>
              <p className="mt-1">Mon–Sat: 10am–8pm, Sun: 11am–6pm</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
