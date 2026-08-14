# Security Audit — X-Rare (Batch 19)

Date: 2026-08-14
Scope: full-stack audit of the storefront, admin panel, and Supabase backend (Postgres RLS, SECURITY DEFINER RPCs, Storage, Auth) against the live hosted project (`vnzynrssckxemredycsw`). Every finding below was verified by attempting the actual attack against the live database with real (throwaway) accounts, not just by reading policy definitions — all test accounts, orders, reviews, and uploaded files were deleted/refunded afterward.

## Summary

| Result | Count |
|---|---|
| Vulnerabilities found and fixed | 3 |
| Attack attempts confirmed blocked (no change needed) | 20+ |
| Accepted risks (documented, not fixed — see below) | 2 |

No customer PII, payment data, or admin capability was found to be reachable by an unauthenticated or under-privileged user by the end of this audit.

## Vulnerabilities found and fixed

### 1. Dangerous file upload accepted by the `review-images` bucket (High)

**Attack**: as an authenticated customer, uploaded (a) an HTML file containing `<script>alert(document.cookie)</script>` with a `.jpg` extension and `Content-Type: text/html`, (b) an SVG containing an embedded `<script>` tag under its real `image/svg+xml` type, (c) a 6MB filler blob claiming to be a JPEG, and (d) a file written into another user's own uid-prefixed storage path. All four succeeded (`200`/`Key` returned) before the fix.

**Root cause**: the bucket had no `allowed_mime_types`/`file_size_limit` set (Storage API enforces nothing without them), and the INSERT policy on `storage.objects` for `review-images` only checked `auth.role() = 'authenticated'` — not that the upload path actually belonged to a review the uploader owns. The `<input accept="image/*">` attribute in `WriteReviewForm.tsx` is a browser UI hint only and is bypassed trivially with a raw request.

**Fix** — `supabase/migrations/0036_storage_upload_hardening.sql`:
- Set `allowed_mime_types = ['image/jpeg','image/png','image/webp','image/gif']` (excluding `image/svg+xml`, which can execute embedded script when a browser navigates to the file directly) and `file_size_limit = 5MB` on both `product-images` and `review-images`.
- Replaced the INSERT policy with one requiring the upload path's review to actually belong to `auth.uid()` (`exists (select 1 from reviews where reviews.id::text = (storage.foldername(name))[1] and reviews.profile_id = auth.uid())`).
- Added `assertValidImageFile()` (`src/utils/fileValidation.ts`) as a client-side pre-check in `reviewRepository.uploadImage()` and `productImageRepository.upload()`, mirroring the same MIME/size rule for a fast, friendly error — the bucket constraint is what actually enforces it.

**Re-verified after fix**: all four attacks now rejected (`415 invalid_mime_type`, `413 EntityTooLarge`, `403` RLS violation for the wrong-owner path); a legitimate upload by the review's real owner still succeeds.

### 2. `settings` table effectively public-read for every key, not just the intended few (Medium)

**Found by policy review, confirmed live**: `0014_rls_policies.sql` made `settings` admin-only-read. `0032_homepage_builder.sql` later added `"Public can read settings" for select using (true)` so the announcement bar / footer tagline / support email could be read by anonymous visitors — but Postgres RLS policies for the same command **OR together**, so this didn't scope down the original policy, it made the *entire table* public-read. Confirmed live: `select key from settings` with only the anon key returned every row, not just the 4 intended keys. Nothing sensitive is stored there today, but any future admin-only setting (an API toggle, an internal flag) added without revisiting this policy would leak silently.

**Fix** — `supabase/migrations/0037_narrow_public_settings_read.sql`: dropped the blanket policy and replaced it with `using (key in ('support_email', 'announcement_enabled', 'announcement_message', 'footer_tagline'))` — the exact 4 keys actually read by public-facing code (`Header.tsx`, `Footer.tsx`, `Contact.tsx`, confirmed by grep). Admins still read every key via the original `0014` admin policy (policies OR together, so staff are unaffected).

**Re-verified after fix**: anon `select key from settings` now returns exactly those 4 rows.

### 3. Password-reset form leaked account existence through its own error handling (Medium)

**Attack**: `ForgotPassword.tsx` has a comment stating it "always shows the same success state regardless of whether the email is registered," and does — *for the happy path*. But Supabase Auth's `/recover` endpoint itself behaves differently for a registered vs. unregistered email: live testing showed a **registered** account's reset request returns `429 over_email_send_rate_limit` once the project's outbound-email quota is under pressure (because Supabase actually attempts to send), while an **unregistered** address always returns `200 {}` immediately (no email attempt is made, so it can never hit that rate limit). The original code's `catch` block set `error` to `err.message` and displayed it, which — whenever the underlying call threw for *any* reason, including this exact signal — showed a different screen than the generic "Check your email" success state, defeating the anti-enumeration design the comment claimed to have.

**Fix** — `src/pages/auth/ForgotPassword.tsx`: the `catch` block no longer surfaces any error to the UI. `sent` is now set to `true` in a `finally`, so the success screen shows unconditionally regardless of what Supabase's API actually did underneath. (`Register.tsx` was checked too — Supabase's documented `signUp` behavior for an existing *confirmed* email already returns a fake success response with `identities: []`, not an error, so under normal load there's no equivalent leak there; it shares the same rate-limit-under-load edge case as `/recover`, which is a platform quirk rather than an application bug — see Accepted Risks.)

## Attacks attempted and confirmed already blocked

All of the following were attempted live, as an authenticated but non-staff customer, against another customer's data or against staff/system-only resources, using direct REST/RPC calls (i.e. bypassing the SPA's own UI/route guards entirely — RLS and RPC-level checks are the only thing standing between the request and the database):

| Attack | Result |
|---|---|
| Read another customer's order, order items, shipping address, payments | 0 rows returned (RLS) |
| `PATCH` another customer's order status directly | 0 rows affected (`return=representation` confirms — no client UPDATE policy exists on `orders` at all) |
| Insert a forged `order_items` row (fake cheap price) into another customer's order | `403` — RLS policy violation (no client INSERT policy on `order_items`) |
| Insert a forged `payments` row marking an order paid | `403` — RLS policy violation |
| Read another customer's wishlist / cart | 0 rows returned (RLS) |
| Insert an address into another customer's profile | blocked at RLS (own-row-only policy) |
| Directly `PATCH product_variants.price_cents` (price manipulation) | 0 rows affected (RLS — `content_manager+` only) |
| Insert a `discount_redemptions` row to grant a free discount | `403` — RLS policy violation (no client INSERT policy; only `create_order`'s SECURITY DEFINER path can write here) |
| Read `discounts`/`discount_codes` as a plain customer (code enumeration) | 0 rows returned (staff-only SELECT policy) |
| Set a cart item to a negative or zero quantity (negative-total exploit) | rejected at the database check-constraint level (`cart_items_quantity_check`) before even reaching order creation |
| Complete checkout with a shipping method from the wrong zone (e.g. a Tema rate while shipping to Accra) | rejected by `create_order`'s server-side zone-match validation (`"Selected shipping method is not available for this destination"`) |
| Insert a row directly into `user_roles` granting self `super_admin` | `403` — RLS policy violation (`super_admin`-only write policy) |
| Read staff-only tables directly (`notifications`, `analytics_events`, `audit_logs`, `payment_webhook_events`, `inventory_movements`) as a plain customer | 0 rows returned for every table (RLS) |
| Call `cancel_order` / `process_pending_notifications` RPCs as a plain customer | `400 "Not authorized."` — explicit in-function `has_any_role()` check |
| Directly `UPDATE inventory.available` | rejected — `available` is a Postgres *generated column*, cannot be written even by staff; the only real write path is `inventory_movements` (which is itself RLS-gated to `inventory_manager+`) |
| Insert an `inventory_movements` row as a customer (fake restock) | `403` — RLS policy violation |
| Call `process_payment` on another customer's order (fake payment success on someone else's order) | `400 "This order does not belong to you."` |
| Call `process_payment` twice on the same order (payment webhook replay) | first call succeeds and sets `orders.status = 'paid'`; the immediate replay returns `400 "This order has already been processed."` — idempotent by design |

### Notes on specific checklist items

- **"Change product prices" / "Change order totals"**: `create_order` never accepts a price from the client at all — it re-derives unit price from the live `product_variants.price_cents` row, re-locks and re-checks inventory (`select ... for update`), and recomputes discount/shipping/tax entirely server-side. There is no code path, RPC or otherwise, that accepts a client-supplied total.
- **"Fake payment success" / "Replay payment webhooks"**: the real webhook Edge Functions (`supabase/functions/payment-webhook`, `initialize-payment`) are written correctly (HMAC signature verification, independent server-side transaction verification, `(provider, event_id)` idempotency key) but **are not deployed** in this environment (Edge Function deployment has been 403-blocked all session — confirmed in earlier batches). The function that actually sets `orders.status = 'paid'` today is `process_payment(order_id, card_number)`, a simulated-gateway RPC granted to `anon, authenticated`. It was specifically targeted for the two attacks above and both are blocked, as shown. This remains the single most important thing to re-verify once real Edge Functions can be deployed — the code for the real path already exists and looks correct, it just isn't live yet.
- **"Upload dangerous files"**: was vulnerable, now fixed — see Vulnerability #1 above.

## Other areas reviewed

- **Secrets/environment variables**: only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are ever read via `import.meta.env` (both meant to be public). No service-role key, payment secret key, or webhook signing secret is referenced anywhere in `src/`. `.env.example` documents that the Paystack/Flutterwave secret keys are Edge-Function-only (`supabase secrets set`), never client-side. `.env.local`/`.env` are git-ignored.
- **XSS**: zero uses of `dangerouslySetInnerHTML`, `innerHTML`, or `insertAdjacentHTML` anywhere in `src/` (React's default JSX escaping is relied on everywhere, including user-submitted review titles/bodies).
- **SQL injection**: every `.rpc()` call passes arguments as bound parameters, never string-interpolated. No dynamic/`EXECUTE`-built SQL exists anywhere in the PL/pgSQL migrations — every function uses static, parameterized queries.
- **CSRF**: not applicable in the traditional sense — the SPA authenticates every request with a bearer token in the `Authorization` header (Supabase's default), not cookies, so there is no ambient credential for a third-party site to ride on.
- **Admin route guards** (`RequireAuth`, `RequireStaffRole`, `RequireGuest`): confirmed to be UX-only by design (documented in their own file comments) — every table those routes read/write already has a matching RLS policy, so a bug or bypass in the client-side guard cannot itself expose data; the database is the actual boundary. This was the working assumption verified throughout every attack in this audit, since every test above was run directly against the REST/RPC API, never through the app's UI.

## Accepted risks (not fixed this batch)

These were identified but intentionally left as-is, per the batch's "do not add features unless required to fix a security problem" constraint — building real fixes for either would mean standing up server-side infrastructure (an Edge Function or equivalent) that isn't deployed in this environment, which is a larger change than a security-audit batch should make. Both are documented here so they're revisited when Edge Functions can actually be deployed.

1. **No application-layer rate limiting.** Login attempts, discount-code validation (`validate_discount_code`, callable unlimited times by `anon`), and password-reset requests have no throttling in this codebase. Supabase's own platform-level Auth rate limits are the only backstop today (and are what produced the `429` seen while testing #3 above). The one live discount code in the database (`WELCOME10`) is an intentionally-shareable marketing code, not a secret, so this isn't an active exploit path yet — but any future single-use/high-value code would be brute-forceable at whatever rate the client can sustain. **Recommendation**: add per-IP/per-session throttling at the Edge Function layer once one is deployed; a pure-Postgres solution isn't practical without either storing IP addresses (which the app deliberately avoids for privacy, see `analytics_events`'s design) or relying on the spoofable client-supplied analytics session id.
2. **Account-enumeration side channel via Supabase Auth's own rate-limit behavior.** As found in Vulnerability #3, Supabase's hosted `/recover` and `/signup` endpoints behave differently for existing vs. non-existing accounts once the project's outbound-email quota is exhausted (a registered account attempts a real send and can hit `429`; an unregistered one never tries). The `ForgotPassword.tsx` fix closes this for the app's own UI, but a caller hitting Supabase's REST API directly (bypassing the SPA entirely, the same way this audit did) still observes the raw distinguishing responses — this is platform behavior, not something fixable from client code. **Recommendation**: if this needs closing at the API level too, route auth actions through a server-side proxy (Edge Function) that normalizes timing and always returns an identical generic response, once Edge Functions can be deployed.

## Methodology note

All "malicious customer" attacks above were run with two real, disposable Supabase Auth accounts (customer A attacking customer B's real order/cart/wishlist/review data) plus a temporary staff account (to run and verify the cleanup RPCs afterward) — never against the RLS policies in the abstract. Every write attempt used `Prefer: return=representation` so a `200`/`204` with zero affected rows (which PostgREST returns by default even when RLS silently drops the row, and is easy to misread as "succeeded") could be told apart from an actual write. All test accounts, their orders (refunded, inventory restocked), reviews, and uploaded storage objects were deleted after the audit; nothing from this process was left in the live database.
