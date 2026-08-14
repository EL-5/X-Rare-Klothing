import { discountRepository, type DiscountInput, type DiscountValidation, type DiscountWithCode } from '@/repositories/discountRepository';
import type { Discount } from '@/types/domain';

export interface DiscountService {
  validateCode(code: string, cartId: string): Promise<DiscountValidation>;
  getByCode(code: string): Promise<Discount | null>;
  listForAdmin(): Promise<DiscountWithCode[]>;
  create(input: DiscountInput): Promise<DiscountWithCode>;
  update(id: string, input: Partial<DiscountInput>): Promise<DiscountWithCode>;
  remove(id: string): Promise<void>;
}

class SupabaseDiscountService implements DiscountService {
  validateCode(code: string, cartId: string): Promise<DiscountValidation> {
    return discountRepository.validateCode(code, cartId);
  }

  getByCode(code: string): Promise<Discount | null> {
    return discountRepository.getByCode(code);
  }

  listForAdmin(): Promise<DiscountWithCode[]> {
    return discountRepository.listWithCodes();
  }

  create(input: DiscountInput): Promise<DiscountWithCode> {
    return discountRepository.create(input);
  }

  update(id: string, input: Partial<DiscountInput>): Promise<DiscountWithCode> {
    return discountRepository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return discountRepository.remove(id);
  }
}

export const discountService: DiscountService = new SupabaseDiscountService();
