import { supabase } from '@/lib/supabase';
import type { TaxRate } from '@/types/domain';
import { mapTaxRate } from './mappers';

export const taxRepository = {
  /** Exact country+region match first (e.g. US/NY), falling back to a country-wide rate (region IS NULL) if one exists. */
  async getRate(countryCode: string, region: string | null): Promise<TaxRate | null> {
    if (region) {
      const { data, error } = await supabase
        .from('tax_rates')
        .select('*')
        .eq('country_code', countryCode)
        .eq('region', region)
        .maybeSingle();
      if (error) throw error;
      if (data) return mapTaxRate(data);
    }

    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('country_code', countryCode)
      .is('region', null)
      .maybeSingle();
    if (error) throw error;
    return data ? mapTaxRate(data) : null;
  },
};
