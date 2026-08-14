import { checkoutRepository, type CreateOrderInput, type CreateOrderResult, type PaymentResult } from '@/repositories/checkoutRepository';

export interface CheckoutService {
  placeOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  pay(orderId: string, cardNumber: string): Promise<PaymentResult>;
}

class SupabaseCheckoutService implements CheckoutService {
  placeOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    return checkoutRepository.createOrder(input);
  }

  pay(orderId: string, cardNumber: string): Promise<PaymentResult> {
    return checkoutRepository.processPayment(orderId, cardNumber);
  }
}

export const checkoutService: CheckoutService = new SupabaseCheckoutService();
