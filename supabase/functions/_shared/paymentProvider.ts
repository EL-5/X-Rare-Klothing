// Provider-independent payment architecture (Batch 12). Every concrete
// provider (Paystack, Flutterwave, ...) implements this same interface, so
// initialize-payment and payment-webhook never branch on "which provider"
// beyond picking which implementation to construct.

export interface InitializeParams {
  /** Our own order reference — becomes the provider's tx_ref/reference so we can look the order up again from a webhook or verify call without a second round trip. */
  reference: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  /** Where the provider redirects the browser back to after payment (success or failure — the redirect itself is never trusted, only used to route the UI to a "verifying..." screen). */
  redirectUrl: string;
}

export interface InitializeResult {
  /** Provider-hosted checkout page the browser should be redirected to. */
  authorizationUrl: string;
  /** Provider's own identifier for this attempt, if different from our reference (Paystack reuses it; Flutterwave issues its own numeric id we need for verify_by_reference to also work). */
  providerReference: string;
}

export type VerifiedStatus = 'successful' | 'failed' | 'processing';

export interface VerifyResult {
  status: VerifiedStatus;
  amountCents: number;
  currency: string;
  reference: string;
  raw: unknown;
}

export interface WebhookEvent {
  /** Used for the payment_webhook_events idempotency key — must be stable across provider retries of the same event. */
  eventId: string;
  reference: string;
}

export interface PaymentProvider {
  readonly name: 'paystack' | 'flutterwave';
  initialize(params: InitializeParams): Promise<InitializeResult>;
  /** Always re-fetches status from the provider's own API — the one "verify transaction server-side" step nothing else is allowed to skip. */
  verifyTransaction(reference: string): Promise<VerifyResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean>;
  parseWebhookEvent(rawBody: string): WebhookEvent;
}
