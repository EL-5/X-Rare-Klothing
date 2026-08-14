import { supabase } from '@/lib/supabase';
import type { CheckoutAddressInput } from '@/types/database';

export interface CreateOrderInput {
  cartId: string;
  email: string;
  shippingAddress: CheckoutAddressInput;
  shippingMethodId: string;
  customerNotes?: string;
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  discountCents: number;
  currency: string;
}

export interface PaymentResult {
  status: 'successful' | 'failed';
  orderStatus: string;
  message: string | null;
}

/**
 * Both RPCs are SECURITY DEFINER functions (migration 0022) standing in for
 * the checkout/payment Edge Functions the RLS design originally called for —
 * see orderRepository's own comment. Every price/discount/tax/shipping
 * figure is recomputed there from live tables; nothing is ever trusted from
 * the client beyond ids and free-text fields like name/address.
 */
export const checkoutRepository = {
  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const { data, error } = await supabase.rpc('create_order', {
      _cart_id: input.cartId,
      _email: input.email,
      _shipping_address: input.shippingAddress,
      _shipping_method_id: input.shippingMethodId,
      _customer_notes: input.customerNotes ?? null,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Order creation returned no data.');
    return {
      orderId: data.order_id,
      orderNumber: data.order_number,
      totalCents: data.total_cents,
      discountCents: data.discount_cents,
      currency: data.currency,
    };
  },

  async processPayment(orderId: string, cardNumber: string): Promise<PaymentResult> {
    const { data, error } = await supabase.rpc('process_payment', { _order_id: orderId, _card_number: cardNumber });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Payment returned no data.');
    return { status: data.status, orderStatus: data.orderStatus, message: data.message };
  },
};
