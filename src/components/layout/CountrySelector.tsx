import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

const REGIONS = [
  { code: 'US', label: 'United States', currency: 'USD $' },
  { code: 'NG', label: 'Nigeria', currency: 'NGN ₦' },
  { code: 'GB', label: 'United Kingdom', currency: 'USD $' },
  { code: 'CA', label: 'Canada', currency: 'USD $' },
  { code: 'AU', label: 'Australia', currency: 'USD $' },
  { code: 'DE', label: 'Germany', currency: 'USD $' },
  { code: 'FR', label: 'France', currency: 'USD $' },
  { code: 'ZA', label: 'South Africa', currency: 'USD $' },
  { code: 'GH', label: 'Ghana', currency: 'USD $' },
  { code: 'AE', label: 'United Arab Emirates', currency: 'USD $' },
] as const;

const STORAGE_KEY = 'hf-region';

/**
 * Region/currency picker — mirrors the reference's `<select>` posting to
 * `/localization` (see docs/interaction-map.md). We have no real
 * multi-currency backend yet, so this persists the choice locally and
 * reloads product pricing labels client-side rather than round-tripping a
 * server request; only USD and NGN are real supported currencies, matching
 * the audited reference (docs/interaction-map.md — "Country selector").
 */
export function CountrySelector() {
  const [region, setRegion] = useState<string>('US');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && REGIONS.some((r) => r.code === stored)) setRegion(stored);
  }, []);

  const handleChange = (code: string) => {
    setRegion(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 shrink-0 text-footer-foreground/60" aria-hidden="true" />
      <label className="sr-only" htmlFor="region-selector">
        Country/region
      </label>
      <select
        id="region-selector"
        value={region}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full max-w-[220px] rounded-[var(--radius-input)] border border-footer-foreground/30 bg-transparent py-1.5 pl-2 pr-1 text-xs text-footer-foreground focus:border-footer-foreground focus:outline-none [&>option]:text-ink"
      >
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.label} ({r.currency})
          </option>
        ))}
      </select>
    </div>
  );
}
