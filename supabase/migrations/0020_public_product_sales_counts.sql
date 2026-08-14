-- Storefront "Best selling" sort needs units-sold per product, but
-- inventory_movements is staff-only (see 0014_rls_policies.sql — it can
-- carry internal reasons/reference notes). This function exposes only the
-- safe aggregate (product_id + units_sold), nothing else from the ledger,
-- the same security-definer pattern used by has_role()/has_any_role().

create or replace function public_product_sales_counts()
returns table (product_id uuid, units_sold bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.product_id, sum(abs(m.quantity))::bigint as units_sold
  from inventory_movements m
  join product_variants v on v.id = m.variant_id
  where m.type = 'sale'
  group by v.product_id;
$$;

grant execute on function public_product_sales_counts() to anon, authenticated;
