-- Batch 24 final review, continued: the productRepository.ts column-list
-- fix (0038's companion app-layer change) only stops the app's own UI from
-- displaying cost_cents/barcode — it does nothing against a direct REST
-- call, confirmed live: `GET .../product_variants?select=cost_cents,barcode`
-- with only the public anon key still returns real values. RLS is
-- row-level only; it cannot mask a column. And a plain column-level
-- REVOKE can't distinguish "customer" from "staff" either, because in
-- Supabase every signed-in user — customer or staff — connects as the same
-- shared `authenticated` Postgres role; only `auth.uid()` + the
-- `user_roles` table (i.e. `has_any_role()`) can tell them apart.
--
-- Fix: a SECURITY INVOKER view that computes cost_cents/barcode as NULL
-- unless the caller is staff, while every other column and RLS's row-level
-- filtering (still enforced per-caller, since the view runs with the
-- invoker's own privileges) passes through unchanged. Column-level REVOKE
-- on the base table's two sensitive columns forces every reader — customer
-- or staff — through this view to get a real value.

create view product_variants_readable
  with (security_invoker = true)
  as
  select
    id,
    product_id,
    sku,
    case when has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
      then barcode else null end as barcode,
    price_cents,
    compare_at_price_cents,
    case when has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
      then cost_cents else null end as cost_cents,
    size,
    color,
    material,
    weight_grams,
    is_active,
    position,
    created_at,
    updated_at
  from product_variants;

grant select on product_variants_readable to anon, authenticated;

revoke select (cost_cents, barcode) on product_variants from anon, authenticated;
