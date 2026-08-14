import { shippingRepository } from '@/repositories/shippingRepository';
import type { Money, ShippingRate } from '@/types/domain';

export interface ShippingService {
  listRatesForAddress(countryCode: string, city: string | null): Promise<ShippingRate[]>;
  getCheapestEligibleRate(subtotal: Money, countryCode: string | null, city: string | null): Promise<ShippingRate | null>;
}

class SupabaseShippingService implements ShippingService {
  listRatesForAddress(countryCode: string, city: string | null): Promise<ShippingRate[]> {
    return shippingRepository.listForAddress(countryCode, city);
  }

  async getCheapestEligibleRate(subtotal: Money, countryCode: string | null, city: string | null): Promise<ShippingRate | null> {
    const rates = countryCode
      ? await shippingRepository.listForAddress(countryCode, city)
      : await shippingRepository.listForDefaultZone();
    const eligible = rates.filter((rate) => !rate.minOrder || subtotal.cents >= rate.minOrder.cents);
    if (eligible.length === 0) return null;

    return eligible.reduce((cheapest, rate) => (rate.price.cents < cheapest.price.cents ? rate : cheapest));
  }
}

export const shippingService: ShippingService = new SupabaseShippingService();
