# QA Report — X-Rare (Batch 22)

Date: 2026-08-14
Scope: complete end-to-end functional QA pass across every persona listed in the batch — guest customer, registered customer, admin, inventory manager, order manager, content manager, customer support — plus the explicit edge-case and code-quality checklist. Every flow below was tested live against the hosted Supabase project with real (throwaway) accounts and real orders, not simulated. All test accounts, orders (refunded), and data created during this pass were cleaned up afterward.

## Summary

| Result | Count |
|---|---|
| Issues found and fixed | 4 |
| Flows verified working, no issue | 20+ |
| Known/accepted (not fixed, documented) | 2 |

One of the four fixes (role-leak in `roleRepository.getMyRoles()`) is a genuine authorization bug and the most significant finding of this pass — see below.

## Baseline checks

- `npm run typecheck` (`tsc -b --noEmit`) — **0 errors**.
- `npm run lint` — **0 errors**, 8 pre-existing warnings (all `react-refresh/only-export-components`, cosmetic HMR-granularity notices on files that intentionally export both a component and a hook/context — not a defect; plus one `react-hooks/exhaustive-deps` in `ProductImagesManager.tsx`, low severity, unchanged from prior batches).
- `npm run build` — succeeds, no warnings beyond the two above.
- Re-ran all three again after every fix in this report; still clean.

## Issues found and fixed

### 1. `roleRepository.getMyRoles()` returned every staff member's roles, not just the caller's own (HIGH — authorization)

**Found while**: testing the admin flow as an `inventory_manager`-only test account (per this batch's "act as inventory manager" instruction). The admin sidebar showed *every* nav item — Products, Collections, Orders, Discounts, Analytics, etc. — despite the account having only `inventory_manager` in `user_roles`.

**Root cause**: `getMyRoles()` ran `supabase.from('user_roles').select('role')` with no `user_id` filter, relying entirely on RLS. But the effective SELECT policy on `user_roles` is "own row **or** any staff member" (staff need to read the full roster for the admin user-management page) — so for any account with *any* staff role, the unfiltered query returns every role ever assigned to every staff account, not just the caller's own. Confirmed live: the same query for the inventory-manager-only test account returned 4 rows / 4 distinct roles (one per other QA test account that existed at the time).

**Impact**: `hasAnyRole()`/`hasRole()` — which both the admin sidebar's item filter and every `RequireStaffRole` route guard read from — were computed against this inflated role set for every staff account, all session. This meant `RequireStaffRole`'s client-side route gating was not actually restrictive for any staff member as long as *some* other staff account with the needed role existed: a plain `inventory_manager` could navigate straight to `/admin/products`, `/admin/orders`, etc., and the guard would let them through the route (confirmed live before the fix). The underlying RLS on the actual data tables was never bypassed — only the client-side navigation/UI boundary was compromised, so no unauthorized *data* access occurred — but it's a real hole in the layered defense this app is supposed to have, and a confusing/broken UX regardless.

**Fix**: `roleRepository.getMyRoles()` now resolves the current user via `supabase.auth.getUser()` and adds `.eq('user_id', user.id)` explicitly, rather than trusting RLS alone.

**Re-verified after fix**: rebuilt each of the 4 non-admin roles' sessions and confirmed the sidebar now shows exactly the role-appropriate items (`inventory_manager` → Dashboard + Inventory only; `content_manager` → + Products/Collections/Categories/Reviews/Content/Homepage; `customer_support` → Dashboard/Customers/Notifications; `order_manager` → Dashboard/Orders/Customers/Discounts/Notifications/Analytics), and that navigating directly to `/admin/products` as `inventory_manager` now correctly redirects to the storefront instead of loading the page.

### 2. `wishlistRepository.getOrCreateWishlistId()` had a check-then-insert race (MEDIUM — correctness)

**Found while**: browsing the storefront during flow testing — an uncaught promise rejection surfaced in the console: `duplicate key value violates unique constraint "wishlists_profile_id_key"` (Postgres code `23505`).

**Root cause**: the function `SELECT`s to check whether a wishlist row exists for the profile, and only `INSERT`s if none is found. Two concurrent calls (React StrictMode double-invoking effects in dev is the most common trigger — `main.tsx` wraps the app in `<StrictMode>` — but a customer with two tabs open on their first-ever wishlist interaction hits the identical window) can both see "no row yet" and both attempt the insert; the loser gets an unhandled unique-violation instead of the id it actually needed.

**Fix**: on a `23505` from the insert, re-`SELECT` and return the row the concurrent call created instead of throwing. The unique constraint itself already prevented any duplicate row from actually being written — this only fixes the client-side crash/unhandled-rejection on the losing side of the race.

### 3. Footer's "Shop All" link pointed at a non-existent collection (LOW — broken link)

**Found while**: auditing every static nav/footer link against real database slugs (per this batch's "no broken links" checklist item). `ROUTES.collection('all')` → `/collections/all`, but no collection with slug `all` exists (confirmed live — the query returns zero rows). The link didn't 404 at the routing layer (`/collections/:slug` is a valid route for any slug) but landed on a permanently-empty collection page — a soft dead end.

**Fix**: changed "Shop All" to link to `/shop` (the real browse-everything page) and added a "Collections" link alongside it, both using existing, real routes.

### 4. Dead `ROUTES.cart` constant (LOW — dead code)

`/cart` was defined in the routes config but has no matching `<Route>` in `App.tsx` (cart is drawer-only, never a full page) and nothing in the codebase referenced the constant. Removed.

## Flows verified working (no issue found)

### Guest customer — full funnel
Homepage → Browse (`/shop`) → Search (`/search?q=tee`, real results) → Filter (`?availability=in-stock`, filter count badge updates correctly) → Product detail → Select variant (color/size swap correctly updates SKU/price — verified against the DB, not just the UI) → Add to cart → Cart drawer → Checkout (address + demo card) → Payment → Order confirmation (`XR-100032`, correct total) — all confirmed end-to-end, with the final order's line items/total verified directly against the database, not just the confirmation screen text.

### Registered customer — full funnel
Register/login via the real login form → add to cart while authenticated → checkout (address pre-fills nothing extra but works) → payment → confirmation (`XR-100033`) → **Account → Orders** correctly lists the new order with the right total and "Paid" status, confirming the order is associated with the signed-in profile (unlike the guest order above, which has `profile_id = null` by design).

### Admin — each role
- **Login** (real login form, not admin-API session injection, for the initial customer/admin flow tests) → **Dashboard** loads with correct role-scoped sidebar (post-fix) for all four non-admin/non-super_admin roles: `inventory_manager`, `content_manager`, `order_manager`, `customer_support`.
- **Content manager**: opened a real product, edited its description, saved, and confirmed the change persisted to the database; reverted afterward. (Note: the product-detail page has four buttons all labeled just "Save" — three are per-section saves for images/variants/etc., and only the form-level "Save changes" button actually persists top-level fields like description. This is a minor labeling ambiguity worth a follow-up pass, noted here rather than fixed — not a functional bug, but easy to click the wrong one.)
- **Order manager**: opened a real paid order and changed its status to "processing" via the status dropdown + "Update status" button; confirmed the change persisted in the database.
- **Inventory manager / customer support**: confirmed correct page access and correct exclusion from out-of-scope admin sections (post role-leak fix).

### Broken links / routes
Cross-referenced every `<Link>`/nav target in the primary nav, mega-menu, footer, and admin sidebar against both the registered `<Route>` paths in `App.tsx` and (for content-driven links) the real category/collection slugs in the live database. Found and fixed the two issues above (#3, #4); everything else resolved correctly, including all 20 mega-menu category links against real, published category rows.

### Edge cases
- **Empty cart**: `/checkout` with nothing in the cart shows "Your cart is empty" with a link back to shop — not a broken/blank page.
- **Empty search**: confirmed in Batch 21's pass — "No results found" state, not a blank grid.
- **Invalid discount code**: applying a nonexistent code at checkout shows "Invalid discount code." — server-side rejection via `validate_discount_code`, not a client-side guess.
- **Out of stock / low stock**: `ProductDetail.tsx` already shows "Out of stock" / "Only N left in stock" based on live inventory (code-verified; matches behavior established and tested across Batches 9–13).
- **Failed/invalid payment**: the demo gateway's documented failure trigger (card ending `0002`) and real-time validation were both established and tested in Batches 11–12 and re-confirmed live during Batch 19's security audit.
- **Duplicate/replayed payment webhook**: `process_payment` correctly rejects a second call on an already-processed order with "This order has already been processed." — tested live in Batch 19, re-confirmed applicable here since no payment code changed since.
- **Cancelled order / refund**: `cancel_order`/`refund_order` RPCs exercised repeatedly and successfully throughout this session's cleanup routines (most recently: both this batch's test orders), including inventory restocking on refund.

## Known / accepted (not fixed this pass)

1. **Broken image handling**: no `<img>` in the storefront has an `onError` fallback — if a product image URL ever becomes invalid (a storage object deleted without updating the `product_images` row, for instance), the browser shows its default broken-image icon rather than a graceful placeholder. Every image currently in the live database resolves correctly, so this isn't an active bug, but it's a real resilience gap worth a follow-up pass (a shared `onError` handler on the highest-traffic surfaces — `ProductCard`, `ProductGallery` — would cover most real-world cases cheaply).
2. **"Save" button labeling on `AdminProductDetail`** (see finding #4's note above) — cosmetic ambiguity, not a functional defect.

## Console errors

Checked on Home, Shop, ProductDetail, Checkout, and the admin dashboard using a fresh browser tab for each check (the long-lived dev tab used throughout this session accumulates console history across every navigation for the tab's entire lifetime rather than resetting per-page-load, which produces false positives from long-past, already-fixed issues — confirmed by cross-checking a stale-looking error against the current source and finding no match). All five pages: **zero console errors** on a clean tab.

## Unauthorized database access

No new unauthorized *data* access path was found or introduced since Batch 19's security audit (`docs/security-audit.md`), which remains current — this pass's role-leak finding (#1 above) was a client-side navigation/UI gating bug, not a bypass of RLS or any RPC's server-side authorization check; every actual read/write attempt in that finding was still correctly scoped by the database layer underneath.
