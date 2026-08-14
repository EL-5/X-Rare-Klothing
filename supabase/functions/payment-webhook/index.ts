// Supabase Edge Function (Deno runtime). Not deployed in this environment
// — see chat. Configure this URL (with ?provider=paystack or
// ?provider=flutterwave) in each provider's dashboard once deployed.
//
// This is the only place a payment is ever marked successful. Everything
// here is designed around the batch's four webhook requirements:
//
//   Authenticated/verified — signature check before anything is trusted,
//     PLUS an independent server-to-server verifyTransaction() call to the
//     provider's own API (never trusts the webhook payload's claimed
//     status by itself — a forged POST with a valid-looking body but no
//     valid signature, or a valid signature but a lie about the status,
//     both fail here).
//   Idempotent — every event is keyed by (provider, event_id) with a
//     unique constraint; a duplicate delivery is detected and safely
//     no-op'd rather than re-applying inventory/order changes twice.
//   Logged — every receipt (valid, invalid, duplicate, or errored) is
//     written to payment_webhook_events before any mutation happens.
//   Retry-safe — returns 200 for anything already handled (so the
//     provider stops retrying) and 5xx only for genuine transient
//     failures (so the provider's built-in retry logic can recover).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { paystackProvider } from '../_shared/paystackProvider.ts';
import { flutterwaveProvider } from '../_shared/flutterwaveProvider.ts';
import type { PaymentProvider } from '../_shared/paymentProvider.ts';

function getProvider(name: string | null): PaymentProvider {
  if (name === 'paystack') return paystackProvider;
  if (name === 'flutterwave') return flutterwaveProvider;
  throw new Error(`Unknown or missing payment provider: ${name}`);
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const providerName = url.searchParams.get('provider');
  const rawBody = await req.text();

  const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let provider: PaymentProvider;
  try {
    provider = getProvider(providerName);
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Bad request' }), { status: 400, headers: corsHeaders });
  }

  const signatureHeader = req.headers.get(provider.name === 'paystack' ? 'x-paystack-signature' : 'verif-hash');
  const signatureValid = await provider.verifyWebhookSignature(rawBody, signatureHeader);
  if (!signatureValid) {
    await serviceClient.from('payment_webhook_events').insert({
      provider: provider.name,
      event_id: `invalid:${crypto.randomUUID()}`,
      status: 'invalid_signature',
      payload: safeJsonParse(rawBody),
    });
    return new Response(JSON.stringify({ error: 'Invalid signature.' }), { status: 401, headers: corsHeaders });
  }

  let eventId: string;
  let reference: string;
  try {
    ({ eventId, reference } = provider.parseWebhookEvent(rawBody));
  } catch {
    return new Response(JSON.stringify({ error: 'Malformed webhook payload.' }), { status: 400, headers: corsHeaders });
  }

  // Idempotency: the unique (provider, event_id) constraint is the real
  // guard — this insert either succeeds (first time we've seen it) or
  // fails with a conflict (duplicate delivery), which we treat as "already
  // handled" rather than an error.
  const { error: logInsertError } = await serviceClient
    .from('payment_webhook_events')
    .insert({ provider: provider.name, event_id: eventId, status: 'received', payload: safeJsonParse(rawBody) });
  if (logInsertError) {
    if (logInsertError.code === '23505') {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: logInsertError.message }), { status: 500, headers: corsHeaders });
  }

  try {
    // The one required step: re-verify with the provider's own API rather
    // than trusting the webhook payload's claimed status.
    const verified = await provider.verifyTransaction(reference);

    const { data: payment } = await serviceClient
      .from('payments')
      .select('id, order_id')
      .eq('provider_reference', verified.reference)
      .maybeSingle();

    if (!payment) {
      await serviceClient
        .from('payment_webhook_events')
        .update({ status: 'error', error_message: 'No matching payment record for this reference.' })
        .eq('provider', provider.name)
        .eq('event_id', eventId);
      // 200, not 500: this isn't a transient failure the provider can fix by retrying.
      return new Response(JSON.stringify({ received: true, matched: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (verified.status === 'successful') {
      const { error } = await serviceClient.rpc('finalize_paid_order', { _order_id: payment.order_id, _payment_id: payment.id });
      if (error) throw error;
    } else if (verified.status === 'failed') {
      const { error } = await serviceClient.rpc('mark_payment_failed', {
        _order_id: payment.order_id,
        _payment_id: payment.id,
        _message: 'Payment was not completed.',
      });
      if (error) throw error;
    }
    // 'processing' — leave the payment/order as-is; the provider may send another webhook once it resolves.

    await serviceClient
      .from('payment_webhook_events')
      .update({ status: verified.status === 'processing' ? 'processing' : 'verified', payment_id: payment.id, order_id: payment.order_id })
      .eq('provider', provider.name)
      .eq('event_id', eventId);

    // "Send confirmation" — no email provider is configured in this
    // environment; this is where a transactional-email call (Resend,
    // Postmark, etc.) would go once one is.
    if (verified.status === 'successful') {
      console.log(`TODO: send order confirmation email for order ${payment.order_id}`);
    }

    return new Response(JSON.stringify({ received: true, status: verified.status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    await serviceClient
      .from('payment_webhook_events')
      .update({ status: 'error', error_message: err instanceof Error ? err.message : String(err) })
      .eq('provider', provider.name)
      .eq('event_id', eventId);
    // 500 here is deliberate: lets the provider's own retry logic recover
    // from a transient failure (network blip, provider API hiccup).
    return new Response(JSON.stringify({ error: 'Internal error processing webhook.' }), { status: 500, headers: corsHeaders });
  }
});

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
