# Authorization — High Fashion

## The rule

**Never trust frontend roles.** Every route guard and role check in
`src/components/auth/` and `src/stores/AuthStore.tsx` exists purely for
UX — to avoid flashing account/admin UI at someone who's about to get
redirected. None of it is the actual access-control boundary. The boundary
is **Postgres Row Level Security**, defined in
[supabase/migrations/0014_rls_policies.sql](../supabase/migrations/0014_rls_policies.sql)
and enforced on every query regardless of what the client-side code does,
did, or was tricked into doing. If a route guard had a bug, or someone
called `supabase.from('settings').select('*')` directly from devtools
bypassing every guard, RLS still refuses the read. This is verified below,
not just asserted.

## Admin roles

Six roles (`admin_role` enum, [0001](../supabase/migrations/0001_extensions_and_enums.sql)):
`super_admin`, `admin`, `inventory_manager`, `order_manager`,
`content_manager`, `customer_support`. A user can hold more than one. Roles
live in `user_roles` (`user_id`, `role`) — granting/revoking is
`super_admin`-only at the RLS layer, not just hidden in the UI (see
Verification below — an `inventory_manager` session gets a real Postgres
policy violation when it tries).

### Example: `inventory_manager`

Exactly as specified for this batch:

| | |
|---|---|
| **CAN** | View products, manage inventory, view inventory movements |
| **CANNOT** | Manage administrators, change payment configuration |

This maps directly to RLS policies, not application logic:
- `products` SELECT: granted to everyone for `status = 'active'`, plus
  explicitly to `inventory_manager` for all statuses.
- `inventory` UPDATE / `inventory_movements` INSERT: granted to
  `inventory_manager`.
- `user_roles` INSERT/UPDATE/DELETE: granted **only** to `super_admin` —
  `inventory_manager` has no path to this, even via a direct API call.
- `settings` (where payment/store configuration would live) SELECT/INSERT/
  UPDATE/DELETE: granted **only** to `admin`/`super_admin` — `inventory_manager`
  is not in that list, at all.

The other five roles follow the same pattern; the full CAN/CANNOT table
(used to drive the admin dashboard's own "what can I do" summary) is in
[src/config/adminCapabilities.ts](../src/config/adminCapabilities.ts), and
the policies backing every line of it are in
[supabase/migrations/0014_rls_policies.sql](../supabase/migrations/0014_rls_policies.sql).
[docs/database.md](database.md#row-level-security) has the full table
grant summary.

## Client-side layers (UX only)

Three guard components in [src/components/auth/](../src/components/auth/),
composed in [src/App.tsx](../src/App.tsx):

- **`RequireAuth`** — customer account routes (`/account/*`). Redirects to
  `/login` if not signed in, remembering the intended destination via
  router state so login returns the shopper to where they were headed.
- **`RequireGuest`** — the inverse, on `/login`, `/register`,
  `/forgot-password`: redirects an already-signed-in shopper to `/account`.
- **`RequireStaffRole`** — `/admin/*`. Used twice per admin sub-route: once
  with no `roles` prop at the `/admin` layout level (any staff role at all
  gets past the outer gate), and again per-page with a specific role list
  (e.g. `roles={['inventory_manager', 'admin', 'super_admin']}` on
  `/admin/inventory`), matching [src/layouts/AdminLayout.tsx](../src/layouts/AdminLayout.tsx)'s
  nav, which also hides links a role can't use — same "UX only" caveat.

`AuthStore` exposes `hasRole`/`hasAnyRole`/`isStaff` computed from
`user_roles` rows it read for the current session (RLS: "Users can read
own roles" — `user_id = auth.uid() or is_staff()`, meaning any staff
member can see the *full* roster for the admin dashboard, but the write
policies stay `super_admin`-only).

## Data isolation by table (client access only — staff/service-role paths differ)

| Table | Customer can... |
|---|---|
| `profiles`, `addresses` | Read/write **own row only** |
| `carts`, `cart_items` | Own cart (or an anonymous guest cart — see docs/database.md's trade-off note) |
| `wishlists`, `wishlist_items` | Own wishlist only |
| `orders`, `order_items`, `order_addresses` | **Read own only** — no INSERT/UPDATE for any non-staff role, on purpose (see docs/database.md — order creation is an Edge Function/service-role concern) |
| `payments`, `payment_transactions` | Read own order's payments only |
| `reviews` | Own: full; others': only if `status = 'approved'` |
| `products`, `categories`, `collections`, ... | Public read of published/active content |
| `settings`, `audit_logs`, `user_roles`, `permissions` | No access at all |

## Verification

Two independent passes, both against the **live, hosted** project
(`vnzynrssckxemredycsw`) — not a mocked or local database.

### 1. Scripted, using real authenticated sessions

A one-off Node script (using `@supabase/supabase-js` with the project's
real anon key) created three real Supabase Auth users via the admin API —
two plain customers and one granted `inventory_manager` — signed in as
each with `signInWithPassword`, and issued queries with those real
sessions' JWTs. All test users and their data were deleted after the run;
nothing persisted from the script itself.

| # | Check | Result |
|---|---|---|
| 1 | Customer A cannot read Customer B's order | **PASS** — 0 rows returned |
| 2 | Customer A can read their own order (sanity check) | **PASS** — 1 row returned |
| 3 | Customer A cannot read `settings` | **PASS** — 0 rows returned |
| 4 | Customer A cannot grant themselves an admin role | **PASS** — RLS policy violation error |
| 5 | Customer B cannot read Customer A's order (other direction) | **PASS** — 0 rows returned |
| 6 | `inventory_manager` CAN view products | **PASS** |
| 7 | `inventory_manager` CAN record an inventory movement | **PASS** |
| 8 | `inventory_manager` cannot access `settings` | **PASS** — 0 rows returned |
| 9 | `inventory_manager` cannot grant admin roles | **PASS** — RLS policy violation error |
| 10 | `inventory_manager` cannot update orders | **PASS** — 0 rows affected |
| 11 | A session restored from just its access/refresh tokens (simulating "reload the page") still enforces the same role correctly | **PASS** — settings still 0 rows, inventory still readable |

**11/11 passed.**

### 2. Live in the browser, against the real running app

Using the dev server and a real (temporary, since-deleted) confirmed
account:

- Registered a new account with an invalid-looking test domain →
  Supabase correctly rejected it client-side with a visible error (proves
  error handling works, not just the happy path).
- Registered again with a valid-format email → got the "check your email"
  confirmation state (email confirmation is enabled on this project).
- Logged in with a pre-confirmed test account → landed on `/account`,
  correctly showing "Welcome, UITest" (first name sourced from signup
  metadata via the 0016 migration trigger fix, not hardcoded).
- **Hard-reloaded** `/account` (full page navigation, not a client-side
  route change) → still authenticated, no redirect to `/login`, profile
  still populated. This is the "survives refresh" requirement, demonstrated
  end-to-end rather than only asserted at the API layer.
- Signed out via `/account/settings` → navigating directly to `/account`
  redirected to `/login`.
- Navigating directly to `/admin` while signed out → also redirected to
  `/login`, confirming the admin gate isn't reachable by an anonymous
  visitor either.

## Known gaps (out of scope for this batch)

- **Discount code validation** has no public path yet — `discount_codes`
  is staff-read-only under RLS by design (prevents enumeration), and the
  `SECURITY DEFINER` RPC to validate a code at checkout hasn't been
  written (flagged in docs/database.md since Batch 2).
- **Order creation** is service-role/Edge-Function-only; there is
  currently no Edge Function implementing it, so checkout cannot complete
  end-to-end yet. `orderService` is deliberately read-only from the client.
- **`AdminUsers`** (`/admin/users`, super_admin-only) grants roles by
  pasting a raw `auth.users.id` — there's no user search/lookup UI yet;
  that's a content/tooling improvement, not a security gap (the RLS grant
  path itself is fully enforced regardless).
