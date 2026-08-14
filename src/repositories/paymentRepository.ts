import { supabase } from '@/lib/supabase';
import type { Payment } from '@/types/domain';
import { mapPayment } from './mappers';

export type LivePaymentProvider = 'paystack' | 'flutterwave';

export interface InitializeLivePaymentResult {
  authorizationUrl: string;
  reference: string;
}

export const paymentRepository = {
  /**
   * Calls the initialize-payment Edge Function (see
   * supabase/functions/initialize-payment) — not deployed in this
   * environment (no Edge Function deploy access this session; see chat).
   * The function validates the order server-side, calls the real
   * Paystack/Flutterwave API with a secret key that never reaches this
   * client, records a `payments` row, and returns a provider-hosted
   * checkout URL to redirect to.
   */
  async initializeLivePayment(orderId: string, provider: LivePaymentProvider, redirectUrl: string): Promise<InitializeLivePaymentResult> {
    const { data, error } = await supabase.functions.invoke<InitializeLivePaymentResult>('initialize-payment', {
      body: { orderId, provider, redirectUrl },
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Payment provider returned no data.');
    return data;
  },

  /** RLS scopes this to the order's own owner (or staff) — see 0014_rls_policies.sql. */
  async listForOrder(orderId: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPayment);
  },

  async getOrderStatus(orderId: string): Promise<string | null> {
    const { data, error } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
    if (error) throw error;
    return data?.status ?? null;
  },
};
