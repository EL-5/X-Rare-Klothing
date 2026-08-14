// Real Flutterwave integration (https://developer.flutterwave.com/docs/making-payments,
// https://developer.flutterwave.com/docs/integration-guides/webhooks). Never
// deployed/tested live in this environment — no sandbox key available —
// but the endpoints, request/response shapes, and signature check below
// match Flutterwave's published API exactly.
import type { InitializeParams, InitializeResult, PaymentProvider, VerifyResult, WebhookEvent } from './paymentProvider.ts';

const BASE_URL = 'https://api.flutterwave.com/v3';

function getSecretKey(): string {
  const key = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not configured.');
  return key;
}

function getWebhookHash(): string {
  const hash = Deno.env.get('FLUTTERWAVE_WEBHOOK_HASH');
  if (!hash) throw new Error('FLUTTERWAVE_WEBHOOK_HASH is not configured.');
  return hash;
}

export const flutterwaveProvider: PaymentProvider = {
  name: 'flutterwave',

  async initialize(params: InitializeParams): Promise<InitializeResult> {
    const response = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getSecretKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: params.reference,
        amount: params.amountCents / 100,
        currency: params.currency,
        redirect_url: params.redirectUrl,
        customer: { email: params.customerEmail },
      }),
    });
    const body = await response.json();
    if (!response.ok || body.status !== 'success') {
      throw new Error(body.message ?? 'Flutterwave initialization failed.');
    }
    return { authorizationUrl: body.data.link, providerReference: params.reference };
  },

  async verifyTransaction(reference: string): Promise<VerifyResult> {
    const response = await fetch(`${BASE_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
    });
    const body = await response.json();
    if (!response.ok || body.status !== 'success') {
      throw new Error(body.message ?? 'Flutterwave verification failed.');
    }
    const status = body.data.status === 'successful' ? 'successful' : body.data.status === 'pending' ? 'processing' : 'failed';
    // Flutterwave amounts are in the currency's major unit (e.g. dollars, not cents) — convert back for our cents-everywhere convention.
    return { status, amountCents: Math.round(body.data.amount * 100), currency: body.data.currency, reference: body.data.tx_ref, raw: body.data };
  },

  // deno-lint-ignore require-await
  async verifyWebhookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
    // Flutterwave doesn't HMAC the body — it just expects the exact secret
    // hash you configured in their dashboard to be echoed back verbatim.
    void rawBody;
    return signatureHeader !== null && signatureHeader === getWebhookHash();
  },

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const body = JSON.parse(rawBody);
    return { eventId: `${body.event}:${body.data?.id}`, reference: body.data?.tx_ref };
  },
};
