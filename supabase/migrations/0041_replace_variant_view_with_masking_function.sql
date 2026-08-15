-- Batch 24 final review, continued a third time: 0039's `security_invoker
-- = true` view doesn't work either, once 0040's column-level REVOKE is in
-- place — confirmed live, querying the view as anon now fails with
-- "permission denied for table product_variants". A security-invoker view
-- still checks the *caller's* own column privileges for every column its
-- definition touches, even ones wrapped in a masking CASE expression that
-- would have returned NULL anyway — so the view and the column REVOKE
-- directly conflict; a caller needs raw column access to even evaluate the
-- view, which defeats revoking that same access.
--
-- The correct tool for "return this row, but compute one column
-- differently depending on the real caller's role" when the caller's own
-- Postgres role can't distinguish that (anon/authenticated is shared by
-- every customer and every staff member alike) is what this codebase
-- already uses for the identical problem elsewhere: a SECURITY DEFINER
-- function (see `public_product_sales_counts()` in 0020, which exposes
-- only an aggregate from otherwise staff-only `inventory_movements` the
-- same way). A SECURITY DEFINER function runs with its *owner's*
-- privileges against the base table internally, regardless of the
-- caller's own column grants, and decides what to return in its own body
-- — so it can read the real cost_cents/barcode internally and simply not
-- include them in its result for a non-staff caller.
--
-- Because SECURITY DEFINER bypasses RLS by default, this function
-- explicitly re-implements the exact same row-visibility rule as the
-- table's own "Public can read variants of active products" policy
-- (0014) — active-product variants for everyone, every variant for staff
-- — so it grants no *rows* the RLS policy wouldn't already have allowed,
-- only masks two columns within rows the caller could see anyway.

drop view if exists product_variants_readable;

create or replace function variants_by_ids(_ids uuid[])
returns setof product_variants
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select v.id, v.product_id, v.sku,
      case when has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
        then v.barcode else null end,
      v.price_cents, v.compare_at_price_cents,
      case when has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
        then v.cost_cents else null end,
      v.size, v.color, v.material, v.weight_grams, v.is_active, v.position, v.created_at, v.updated_at
    from product_variants v
    where v.id = any(_ids)
      and (
        exists (select 1 from products p where p.id = v.product_id and p.status = 'active')
        or has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
      );
end;
$$;

create or replace function variants_by_products(_product_ids uuid[])
returns setof product_variants
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select v.id, v.product_id, v.sku,
      case when has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
        then v.barcode else null end,
      v.price_cents, v.compare_at_price_cents,
      case when has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
        then v.cost_cents else null end,
      v.size, v.color, v.material, v.weight_grams, v.is_active, v.position, v.created_at, v.updated_at
    from product_variants v
    where v.product_id = any(_product_ids)
      and (
        exists (select 1 from products p where p.id = v.product_id and p.status = 'active')
        or has_any_role('content_manager', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
      );
end;
$$;

grant execute on function variants_by_ids(uuid[]) to anon, authenticated;
grant execute on function variants_by_products(uuid[]) to anon, authenticated;
