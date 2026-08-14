# Authentication — High Fashion

Customer and admin authentication both run through **Supabase Auth**
(email + password). There is no separate admin login system — an "admin"
is just a regular authenticated user who additionally has one or more rows
in `user_roles` (see [docs/authorization.md](authorization.md)).

## Identity model

`profiles.id` is the same UUID as `auth.users.id` — not a separate
surrogate key. The `handle_new_user()` trigger
([0002_roles_and_profiles.sql](../supabase/migrations/0002_roles_and_profiles.sql),
patched in [0016](../supabase/migrations/0016_profile_first_name_from_signup.sql))
creates the `profiles` row automatically the instant `auth.users` gets a
new row — there is no client-side "create profile" step. `first_name` and
`accepts_marketing`, passed as Supabase signup metadata, are read by that
same trigger, so the profile is fully populated even when email
confirmation delays session creation.

## Flows

All auth actions live on `customerService`
([src/services/customerService.ts](../src/services/customerService.ts));
`AuthStore` ([src/stores/AuthStore.tsx](../src/stores/AuthStore.tsx)) only
*observes* session state — it never mutates it directly. Pages call
`customerService`; `AuthStore`'s `supabase.auth.onAuthStateChange` listener
picks up the resulting session change automatically.

### Register — [/register](../src/pages/auth/Register.tsx)

`customerService.register()` calls `supabase.auth.signUp()` with
`emailRedirectTo: '<origin>/auth/callback'`. Two outcomes, both handled:

- **Email confirmation required** (default for a new Supabase project) —
  no session yet; the page shows a "check your email" state.
- **Confirmation disabled** — a session comes back immediately; the page
  redirects straight to `/account`.

Password must be ≥8 characters (checked client-side before the request;
Supabase also enforces its own minimum server-side).

### Email verification — [/auth/callback](../src/pages/auth/AuthCallback.tsx)

The confirmation email links here. `supabase-js`'s `detectSessionInUrl`
(default `true`) parses the token from the URL and establishes a session
automatically — this page just waits for `AuthStore` to observe it, then
redirects to `/account`. An `error_description` query param (expired/used
link) is shown instead of redirecting.

### Login — [/login](../src/pages/auth/Login.tsx)

`customerService.signIn()` → `supabase.auth.signInWithPassword()`. On
success, redirects to the location `RequireAuth` remembered via router
state (`location.state.from`), or `/account` if the shopper arrived here
directly.

### Logout

`customerService.signOut()` → `supabase.auth.signOut()`, called from
[/account/settings](../src/pages/account/Settings.tsx). `AuthStore` clears
`session`/`profile`/`roles` via the auth-state-change listener; nothing else
needs to reset state manually.

### Forgot / reset password

- [/forgot-password](../src/pages/auth/ForgotPassword.tsx) →
  `customerService.requestPasswordReset()` →
  `supabase.auth.resetPasswordForEmail()`, redirecting to
  `<origin>/reset-password`. The success state is shown **regardless of
  whether the email is registered** — this form must not be usable to
  enumerate accounts.
- [/reset-password](../src/pages/auth/ResetPassword.tsx) — `supabase-js`
  exchanges the email link's token for a temporary recovery session on
  load. The page waits for that session (via `AuthStore`), then
  `customerService.updatePassword()` → `supabase.auth.updateUser()`. No
  session present (expired/invalid link) → "reset link expired" state
  instead of a form.

### Session persistence

The Supabase client ([src/lib/supabase.ts](../src/lib/supabase.ts)) is
created with `persistSession: true, autoRefreshToken: true` — `supabase-js`
handles storing the session in `localStorage` and refreshing it before
expiry; the app does none of this itself. `AuthStore` calls
`supabase.auth.getSession()` once on mount to hydrate from that storage,
and `isLoading` stays `true` until that resolves — route guards check
`isLoading`, not just `!session`, specifically so a signed-in shopper never
gets bounced to `/login` for a single frame while the stored session is
still loading.

**Verified live** (see [docs/authorization.md](authorization.md#verification)
for the full results): registered and logged in a real account against the
hosted project, then did a **hard page reload** on `/account` — session
and profile were restored with no re-login, and `RequireAuth` did not
redirect. Signed out and confirmed `/account` and `/admin` both redirect
to `/login` when there is no session.

## Customer account routes

All behind `RequireAuth` (redirects to `/login`, remembering the intended
destination):

| Route | Page |
|---|---|
| `/account` | Overview — quick links, profile summary |
| `/account/profile` | Edit name/phone |
| `/account/orders` | Order history (own orders only — RLS) |
| `/account/orders/:id` | Order detail (404s gracefully if the id isn't yours — see authorization.md) |
| `/account/addresses` | Manage shipping/billing addresses |
| `/account/wishlist` | Saved products |
| `/account/settings` | Email preferences, password change, sign out |

## What's intentionally not built here

- **Social/OAuth login** — not requested; email+password only.
- **Multi-factor auth** — not requested.
- **Order creation / checkout** — `orderService` is read-only from the
  client by design (see docs/database.md and docs/authorization.md); a
  real checkout flow needs a service-role Edge Function, which is a
  separate batch of work.
