import { taxRepository } from '@/repositories/taxRepository';
import type { Money } from '@/types/domain';

export interface TaxService {
  estimate(countryCode: string, region: string | null, taxableAmount: Money, shippingAmount: Money | null): Promise<Money | null>;
}

class SupabaseTaxService implements TaxService {
  async estimate(countryCode: string, region: string | null, taxableAmount: Money, shippingAmount: Money | null): Promise<Money | null> {
    const rate = await taxRepository.getRate(countryCode, region);
    if (!rate) return null;

    const taxableCents = taxableAmount.cents + (rate.isShippingTaxable ? (shippingAmount?.cents ?? 0) : 0);
    return { cents: Math.round(taxableCents * rate.rate), currency: taxableAmount.currency };
  }
}

export const taxService: TaxService = new SupabaseTaxService();
