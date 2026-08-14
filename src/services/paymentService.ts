import { paymentRepository, type InitializeLivePaymentResult, type LivePaymentProvider } from '@/repositories/paymentRepository';
import type { Payment } from '@/types/domain';

export interface PaymentService {
  initializeLivePayment(orderId: string, provider: LivePaymentProvider, redirectUrl: string): Promise<InitializeLivePaymentResult>;
  listForOrder(orderId: string): Promise<Payment[]>;
  pollOrderStatus(orderId: string, expectedStatuses: string[], timeoutMs?: number, intervalMs?: number): Promise<string | null>;
}

class SupabasePaymentService implements PaymentService {
  initializeLivePayment(orderId: string, provider: LivePaymentProvider, redirectUrl: string): Promise<InitializeLivePaymentResult> {
    return paymentRepository.initializeLivePayment(orderId, provider, redirectUrl);
  }

  listForOrder(orderId: string): Promise<Payment[]> {
    return paymentRepository.listForOrder(orderId);
  }

  /**
   * Used by the post-redirect "verifying your payment" screen. Never marks
   * anything paid itself — it only reads back whatever the payment-webhook
   * Edge Function has already committed server-side (see Batch 12: "Never
   * mark an order paid based solely on frontend callback"). Stops once the
   * order reaches a terminal-for-this-wait status or the timeout elapses.
   */
  async pollOrderStatus(orderId: string, expectedStatuses: string[], timeoutMs = 30000, intervalMs = 2000): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;
    let status = await paymentRepository.getOrderStatus(orderId);
    while (status && !expectedStatuses.includes(status) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      status = await paymentRepository.getOrderStatus(orderId);
    }
    return status;
  }
}

export const paymentService: PaymentService = new SupabasePaymentService();
