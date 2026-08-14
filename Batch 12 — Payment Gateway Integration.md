Implement a provider-independent payment architecture.

Create:

PaymentProvider

Implement:

PaystackProvider
FlutterwaveProvider

Do not expose secret keys in the frontend.

Use environment variables.

## FLOW

Customer starts checkout

↓

Create pending order

↓

Create payment transaction

↓

Initialize payment

↓

Customer completes payment

↓

Payment provider webhook

↓

Verify transaction server-side

↓

Update payment

↓

Update order

↓

Finalize inventory

↓

Send confirmation

## WEBHOOKS

Implement secure webhook endpoints.

Webhook processing must be:

Authenticated/verified
Idempotent
Logged
Retry-safe

Never mark an order paid based solely on frontend callback.

## PAYMENT STATES

pending
processing
successful
failed
refunded
partially_refunded

## ORDER STATES

pending
payment_pending
paid
processing
ready_for_shipping
shipped
delivered
cancelled
refunded
partially_refunded

Test successful and failed payments.

Use test/sandbox credentials only during development.