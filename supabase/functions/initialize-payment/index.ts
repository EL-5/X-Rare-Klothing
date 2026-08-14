// Supabase Edge Function (Deno runtime). Not deployed in this environment
// — see chat: no Edge Function deploy access this session. Run
// `supabase functions deploy initialize-payment` (and set
// PAYSTACK_SECRET_KEY / FLUTTERWAVE_SECRET_KEY via `supabase secrets set`)
// to go live.
//
// Flow position: "Create pending order" already happened (create_order RPC,
// Batch 11) before this is called. This function does "Create payment
// transaction" + "Initialize payment" — it talks to the real provider with
// a secret key that only ever lives in this server-side runtime, then
// hands the browser a redirect URL. It never decides the order is paid;
// only the webhook (payment-webhook) does that, after independently
// verifying with the provider.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { paystackProvider } from '../_shared/paystackProvider.ts';
import { flutterwaveProvider } from '../_shared/flutterwaveProvider.ts';
import type { PaymentProvider } from '../_shared/paymentProvider.ts';

interface RequestBody {
  orderId: string;
  provider: 'paystack' | 'flutterwave';
  redirectUrl: string;
}

function getProvider(name: string): PaymentProvider {
  if (name === 'paystack') return paystackProvider;
  if (name === 'flutterwave') return flutterwaveProvider;
  throw new Error(`Unknown payment provider: ${name}`);
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const { orderId, provider: providerName, redirectUrl } = (await req.json()) as RequestBody;
    if (!orderId || !providerName || !redirectUrl) {
      return new Response(JSON.stringify({ error: 'orderId, provider, and redirectUrl are required.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // RLS-scoped client (the caller's own JWT, or none for a guest) — reading
    // the order goes through the same policies the rest of the app uses
    // (owner, or the guest capability-token read added in migration 0023).
    const authHeader = req.headers.get('Authorization') ?? '';
    const scopedClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: order, error: orderError } = await scopedClient
      .from('orders')
      .select('id, order_number, email, status, total_cents, currency')
      .eq('id', orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found.' }), { status: 404, headers: corsHeaders });
    }
    if (order.status !== 'pending' && order.status !== 'payment_pending') {
      return new Response(JSON.stringify({ error: 'This order has already been processed.' }), { status: 409, headers: corsHeaders });
    }

    const provider = getProvider(providerName);
    // Every attempt gets its own reference so retries after a failed
    // payment don't collide with the provider's own idempotency handling.
    const reference = `${order.order_number}-${Date.now().toString(36)}`;

    const result = await provider.initialize({
      reference,
      amountCents: order.total_cents,
      currency: order.currency,
      customerEmail: order.email,
      redirectUrl,
    });

    // Privileged writes — payments/orders have no client insert/update
    // grant (see 0014_rls_policies.sql), so this uses the service role.
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { error: insertError } = await serviceClient.from('payments').insert({
      order_id: order.id,
      provider: provider.name,
      provider_reference: result.providerReference,
      status: 'pending',
      amount_cents: order.total_cents,
      currency: order.currency,
    });
    if (insertError) throw insertError;

    const { error: updateError } = await serviceClient.from('orders').update({ status: 'payment_pending' }).eq('id', order.id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ authorizationUrl: result.authorizationUrl, reference: result.providerReference }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Payment initialization failed.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
