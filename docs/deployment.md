# Deployment — X-Rare (Batch 25)

Date: 2026-08-17

**Production readiness: nearly there.** Everything customer-facing and admin-facing that runs directly against Postgres/RLS/Storage/Auth is production-ready and has been live-verified repeatedly against the hosted project throughout this build. The Edge Function deploy access that blocked this for a long time (every `supabase functions deploy` call returned a 403) is now working — `initialize-payment` and `payment-webhook` are deployed to the live project. What's left is two things only the project owner can do: set the real Paystack/Flutterwave secret keys (see "Payment setup" below), and decide on + wire up a real email provider (see "Email / notifications" below). See "Known gaps" below before reading this as a green light.

## Local development

```bash
git clone https://github.com/EL-5/X-Rare-Klothing.git
cd X-Rare-Klothing
npm install
cp .env.example .env.local   # fill in the two VITE_ values, see below
npm run dev                  # http://localhost:5180 (see .claude/launch.json / vite.config.ts for the port)
```

Other scripts: `npm run build` (typecheck + sitemap generation + production build), `npm run typecheck`, `npm run lint`, `npm run format`.

## Environment setup

`.env.example` documents every variable. Only two belong in the frontend's `.env.local` (and in Vercel's project environment variables) — both are meant to be public:

```
VITE_SUPABASE_URL=https://vnzynrssckxemredycsw.supabase.co
VITE_SUPABASE_ANON_KEY=<the project's anon/public key>
```

**Never commit, and never give a `VITE_` prefix to:**
- The Supabase **service role key** (bypasses RLS entirely — used only from this session's own testing scripts against the live DB, never from application code; confirmed via grep in `docs/security-audit.md` that no service-role key is referenced anywhere in `src/`).
- `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH` — these belong exclusively to the Edge Functions' environment (`supabase secrets set ...`), never the frontend build.
- The Postgres database password used for `supabase db push`.
- Any Supabase **JWT secret** (not directly used by this app; Supabase manages token signing itself).

`.env.local` and `.env` are both git-ignored (`.gitignore`); `.env.example` intentionally has no real values.

## Supabase setup

1. Create a Supabase project (or use the existing one this app was built against: `vnzynrssckxemredycsw`).
2. Link the CLI: `npx supabase link --project-ref <ref>`.
3. **Database migrations** — apply every migration in `supabase/migrations/`:
   ```bash
   npx supabase login   # first time only, opens a browser to authorize
   npx supabase link --project-ref vnzynrssckxemredycsw
   npx supabase db push --linked
   ```
   Confirmed applied as of this writing (Batch 25, `0054_rich_order_confirmation_email.sql`).
4. **Row Level Security** — every table has RLS enabled; policies were fully audited in Batch 19 (`docs/security-audit.md`), live-attacked with real accounts, and two real gaps found there were already fixed (a public-read landmine on `settings`, missing storage upload constraints). No new tables have been added since without RLS.
5. **Storage** — two buckets, both created and hardened by the migrations: `product-images` and `review-images`, both `public: true` for read, both now constrained to `image/jpeg|png|webp|gif` with a 5MB size cap (Batch 19), both scoped so only the right role can write (`content_manager+` for product images, the review's own author for review images — path-ownership enforced at the RLS level, not just client-side).
6. **Authentication** — in the Supabase dashboard, under Auth → URL Configuration:
   - **Site URL**: set to the production domain (e.g. `https://x-rare.example.com`).
   - **Redirect URLs**: add `<production-domain>/auth/callback` and `<production-domain>/reset-password` (the two paths the app actually redirects to — see `customerService.ts`'s `emailRedirectTo`/`redirectTo` calls) alongside whatever local-dev URLs are already allow-listed. Both use `window.location.origin` dynamically, so once the domain is added to Supabase's allow-list, no code change is needed to add further environments (staging, preview deployments, etc.) — each just needs its own origin added to the same list.
   - Email templates (confirmation, password reset) are Supabase's defaults unless customized in the dashboard — not managed by this repo.

## Payment setup (Paystack / Flutterwave)

The full-stack code for this exists and is correct — `supabase/functions/initialize-payment` and `supabase/functions/payment-webhook`, with HMAC signature verification, independent server-side transaction verification (never trusting the client callback), and idempotent webhook processing via a unique `(provider, event_id)` key.

**Both functions are now deployed** to the live project (`vnzynrssckxemredycsw`) — confirmed via `supabase functions list`. What's still missing is the provider secrets, which only the account/business owner should set (never paste real API secret keys into a chat session — set them from your own terminal):

```bash
npx supabase login                    # if not already authenticated
npx supabase link --project-ref vnzynrssckxemredycsw
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_live_...
npx supabase secrets set FLUTTERWAVE_SECRET_KEY=FLWSECK-...
npx supabase secrets set FLUTTERWAVE_WEBHOOK_HASH=<a random string, also pasted into Flutterwave's dashboard>
```

The functions don't need redeploying after setting secrets — they read `Deno.env.get(...)` at request time. Then register the webhook URLs in each provider's dashboard:
- Paystack: `https://vnzynrssckxemredycsw.supabase.co/functions/v1/payment-webhook?provider=paystack`
- Flutterwave: `https://vnzynrssckxemredycsw.supabase.co/functions/v1/payment-webhook?provider=flutterwave`

**Until the secrets are set**, calling `initialize-payment` will fail (the function reads the secret and has nothing to call the provider with), so the only live payment path is `process_payment(order_id, card_number)` — a SECURITY DEFINER Postgres RPC that simulates a gateway (any card not ending in `0002` succeeds). This is explicitly a development/demo stand-in, documented as such in the checkout UI itself ("Demo payment — no real card is charged"), and was the deliberate target of Batch 19's payment-fraud testing (confirmed: cannot pay another customer's order, cannot replay a completed payment). **Do not switch the checkout UI to the live paystack/flutterwave option for real customers until the secrets above are set and a real end-to-end payment has been tested with sandbox/test credentials first.**

## Webhook setup

Covered above — the webhook receiver is `payment-webhook`, one function handling both providers via a `?provider=` query param, already coded with idempotency and signature verification. No other webhooks exist in this app (notifications are polled/processed via an RPC the app itself calls, not an inbound webhook).

## Email / notifications

`notifications` are enqueued correctly (order confirmations, shipping updates, newsletter welcomes, admin low-stock alerts — see `supabase/migrations/0034_notifications.sql` and `docs` from Batch 17) and can be viewed/manually processed from `/admin/notifications`. As of Batch 25, `order_confirmation` renders a real itemized email — line items with images (snapshotted at purchase, so historically accurate even after a product is repriced/renamed), a subtotal/discount/shipping/tax/total breakdown, and the shipping address (see `supabase/migrations/0054_rich_order_confirmation_email.sql`).

**No real email provider is connected** — `process_pending_notifications()` marks queued notifications as sent without actually dispatching anything over SMTP. Edge Function deploy access is no longer the blocker here (see above); what's missing is (a) a choice of provider (Resend, Postmark, SES, etc.) and (b) that provider's API key, which — same rule as the payment secrets — should be set directly via `supabase secrets set` from the account owner's own terminal, never pasted into a chat session. Once both are decided, wiring up real delivery means: build a small Edge Function that reads pending rows from `notifications`, sends the already-rendered `subject`/`body` via the chosen provider's API, and updates `status`/`sent_at`/`last_error` — the table schema already has everything that function needs, and `render_notification` already produces email-client-safe HTML (table-based layout, inline styles only).

## Vercel deployment

1. Import the GitHub repo (`EL-5/X-Rare-Klothing`) into Vercel.
2. Framework preset: **Vite** (auto-detected).
3. Build command: `npm run build`. Output directory: `dist`. (Both are also pinned explicitly in `vercel.json`, added this batch.)
4. Environment variables (Project Settings → Environment Variables): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — set for Production, Preview, and Development environments as needed.
5. **SPA routing fix**: this is a client-side-routed app (`react-router-dom`'s `BrowserRouter`), so a deep link or page refresh on any non-root path (e.g. `/products/oversized-graphic-tee`) needs to resolve to `index.html` rather than 404 on Vercel's static file server. `vercel.json` (added this batch) adds the necessary rewrite:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
   This was a real, confirmed gap before this batch — the project had no Vercel config at all.
6. Deploy. Vercel gives every push to `main` a production deployment and every PR/branch a preview deployment automatically.

`vercel.json` also sets baseline security headers as of Batch 25 (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`) and long-lived immutable caching for hashed `/assets/*` files. **Deliberately not included: a Content-Security-Policy.** This app loads images from Supabase Storage and Unsplash, calls the Supabase API, and Tailwind/React both rely on inline styles — a CSP tight enough to matter would need every one of those sources allow-listed and tested page-by-page before shipping, which risks silently breaking images or API calls if gotten wrong. Worth doing, but as its own reviewed change, not bundled in here.

## Custom domain

In Vercel: Project Settings → Domains → add the domain, follow Vercel's DNS instructions (A/CNAME record, or nameserver delegation if Vercel manages DNS). Once the domain resolves, add it to Supabase's Auth → URL Configuration → Redirect URLs (see "Supabase setup" above) — auth email links won't work on the new domain until that's done.

## Error handling / logging / monitoring

- Added this batch: a top-level React `ErrorBoundary` (`src/components/ErrorBoundary.tsx`, wired in `main.tsx`) — previously, any uncaught render error anywhere in the component tree would unmount the entire app to a blank white screen with no recovery path; now it shows a "Something went wrong — Reload page" fallback.
- Every repository/service method that talks to Supabase already surfaces real errors (`if (error) throw error`) rather than swallowing them; the UI layer catches and displays them via toasts or inline form errors throughout (verified extensively in Batch 22's QA pass).
- **No error-tracking/monitoring service (Sentry, LogRocket, etc.) is integrated.** The `ErrorBoundary`'s `componentDidCatch` currently only `console.error`s — this is the one line to change to wire up a real monitoring SDK once one is chosen. Not blocking for a first deploy, but worth doing before real production traffic, since right now a production error is only visible to whoever happens to have the browser console open.
- No server-side/API logging exists beyond what Supabase's own dashboard provides (Postgres logs, Auth logs, Storage logs) — sufficient for the current architecture (no custom backend server), but if the payment/email Edge Functions above get deployed, their `console.log` output is visible in the Supabase Functions dashboard logs.

## SEO / Sitemap / Robots

Done in Batch 20 and re-verified in Batch 22: per-route titles/meta descriptions/canonical/Open Graph tags, JSON-LD structured data (Organization, Product, BreadcrumbList, FAQPage), `public/robots.txt`, and a build-time `scripts/generate-sitemap.mjs` that queries real product/category/collection slugs and writes `public/sitemap.xml` as part of `npm run build`. The sitemap's `SITE_URL` defaults to a placeholder (`https://x-rare-klothing.example`, the IANA-reserved example domain) since this project has no deployed production URL yet — **set the `SITE_URL` environment variable in Vercel to the real domain once one exists**, or the generated sitemap will contain the placeholder instead of real URLs.

## Analytics

Batch 18's `analytics_events` table + `AnalyticsService` — self-hosted, writes to the same Supabase project, no third-party script or external dependency. Nothing further to configure for it to keep working in production; the admin dashboard's conversion funnel/customer growth charts read from the same table.

## Production checklist

| Check | Status |
|---|---|
| Database migrations applied | ✅ all applied, confirmed via `supabase migration list --linked` |
| RLS on every table | ✅ audited Batch 19, no gaps found beyond what was already fixed there |
| Authentication (email/password, session handling) | ✅ working; **redirect URLs must be added to Supabase dashboard for the production domain before first deploy** |
| Storage policies | ✅ hardened Batch 19 (MIME/size limits, path-ownership) |
| Payment webhooks | ⚠️ **deployed**, but not live — code is correct and both functions are on the live project; still needs real Paystack/Flutterwave secrets set (owner action, see above) before switching off demo-payment mode |
| CORS | ✅ Edge Functions already send `Access-Control-Allow-Origin: *` with POST/OPTIONS; Supabase's REST/Auth APIs allow browser calls by default |
| Domain configuration | ⚠️ no domain owned yet — steps documented above, action needed at deploy time |
| Email configuration | ❌ **not connected** — notifications render real HTML (incl. items/images/totals as of Batch 25) but nothing actually sends yet; needs a provider choice + API key (owner action, see above) |
| SEO | ✅ Batch 20 |
| Sitemap | ✅ generated at build time; **set `SITE_URL` env var for the real domain** |
| Robots | ✅ `public/robots.txt` |
| Error handling | ✅ ErrorBoundary added this batch; services already throw/surface real errors |
| Logging | ⚠️ no external monitoring service wired up — acceptable for launch, recommended before real traffic |
| Analytics | ✅ Batch 18, self-hosted |

**Bottom line**: the storefront, admin panel, and database are genuinely production-ready. Both Edge Functions are now deployed, closing the gap that blocked this for most of the build. What's left is deliberately left to the project owner rather than done automatically here, because it means handling real financial/API credentials: set the Paystack/Flutterwave secrets (`supabase secrets set ...`, from your own terminal) before switching checkout off demo-payment mode, and choose + wire up a real email provider before customers can expect an actual inbox delivery. Until both are done, the app runs correctly in "demo mode" exactly as it has throughout this entire build — orders complete, confirmation emails render fully (with real item images and totals) and are visible/manually processable from `/admin/notifications`, they just aren't actually delivered to an inbox yet.

## Rollback procedure

- **Frontend (Vercel)**: every deployment is immutable and listed under the project's Deployments tab. To roll back, open the previously-good deployment and click "Promote to Production" (or `vercel rollback` via the CLI) — instant, no rebuild needed.
- **Database (Supabase)**: migrations in this repo are additive/forward-only (no `down` migrations were written, consistent with the whole session's approach). To roll back a bad migration, write and apply a new migration that reverses the specific change (e.g. `drop policy ...` / re-add the old one) rather than trying to un-apply history — safer given other data may have been written against the new schema in the meantime. Always `npx supabase db push --linked --dry-run` first to preview exactly what would change before applying for real.
- **Edge Functions** (once deployed): `supabase functions deploy <name>` re-deploys from source; Supabase keeps no automatic version history for functions the way Vercel does for the frontend, so treat the git history of `supabase/functions/` as the rollback source — check out the previous commit's version of the function and redeploy it.
