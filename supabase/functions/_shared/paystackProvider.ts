// Real Paystack integration (https://paystack.com/docs/api/transaction/,
// https://paystack.com/docs/payments/webhooks/). Never deployed/tested live
// in this environment — no sandbox key available — but the endpoints,
// request/response shapes, and signature algorithm below match Paystack's
// published API exactly.
import type { InitializeParams, InitializeResult, PaymentProvider, VerifyResult, WebhookEvent } from './paymentProvider.ts';

const BASE_URL = 'https://api.paystack.co';

function getSecretKey(): string {
  const key = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  return key;
}

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const paystackProvider: PaymentProvider = {
  name: 'paystack',

  async initialize(params: InitializeParams): Promise<InitializeResult> {
    const response = await fetch(`${BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getSecretKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.customerEmail,
        amount: params.amountCents,
        currency: params.currency,
        reference: params.reference,
        callback_url: params.redirectUrl,
      }),
    });
    const body = await response.json();
    if (!response.ok || !body.status) {
      throw new Error(body.message ?? 'Paystack initialization failed.');
    }
    return { authorizationUrl: body.data.authorization_url, providerReference: body.data.reference };
  },

  async verifyTransaction(reference: string): Promise<VerifyResult> {
    const response = await fetch(`${BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${getSecretKey()}` },
    });
    const body = await response.json();
    if (!response.ok || !body.status) {
      throw new Error(body.message ?? 'Paystack verification failed.');
    }
    const status = body.data.status === 'success' ? 'successful' : body.data.status === 'abandoned' ? 'processing' : 'failed';
    return { status, amountCents: body.data.amount, currency: body.data.currency, reference: body.data.reference, raw: body.data };
  },

  async verifyWebhookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
    if (!signatureHeader) return false;
    const expected = await hmacSha512Hex(getSecretKey(), rawBody);
    return expected === signatureHeader;
  },

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const body = JSON.parse(rawBody);
    return { eventId: `${body.event}:${body.data?.id}`, reference: body.data?.reference };
  },
};
