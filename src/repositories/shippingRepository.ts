import { supabase } from '@/lib/supabase';
import type { ShippingRate } from '@/types/domain';
import { mapShippingRate } from './mappers';

export const shippingRepository = {
  async listForZone(zoneId: string): Promise<ShippingRate[]> {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('zone_id', zoneId)
      .eq('is_active', true)
      .order('price_cents');
    if (error) throw error;
    return (data ?? []).map((row) => mapShippingRate(row));
  },

  /** Resolves the destination's zone (city-specific zones win over a country-wide zone, which wins over the International catch-all) then lists its active methods. */
  async listForAddress(countryCode: string, city: string | null): Promise<ShippingRate[]> {
    const { data: zoneId, error } = await supabase.rpc('resolve_shipping_zone', { _country_code: countryCode, _city: city });
    if (error) throw error;
    if (!zoneId) return [];
    return this.listForZone(zoneId);
  },

  /** Used only when no destination is known yet (e.g. a guest browsing the cart before entering an address) — falls back to the single International/default zone. */
  async listForDefaultZone(): Promise<ShippingRate[]> {
    const { data: zone, error } = await supabase.from('shipping_zones').select('id').eq('is_default', true).maybeSingle();
    if (error) throw error;
    if (!zone) return [];
    return this.listForZone(zone.id);
  },
};
