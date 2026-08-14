-- Batch 10: cart-level discount code + a public-safe discount validation
-- function. discounts/discount_codes stay staff-only under RLS (see
-- 0014_rls_policies.sql), so a shopper can't enumerate live codes — this
-- function returns only the computed result for the one code + subtotal
-- given, never the underlying discount rows. Same security-definer pattern
-- as has_role()/public_product_sales_counts().

alter table carts add column discount_code text;

create or replace function validate_discount_code(_code text, _subtotal_cents integer)
returns table (valid boolean, discount_cents integer, free_shipping boolean, message text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _discount discounts%rowtype;
begin
  select d.* into _discount
  from discounts d
  join discount_codes dc on dc.discount_id = d.id
  where lower(dc.code) = lower(_code)
  limit 1;

  if not found then
    return query select false, 0, false, 'Invalid discount code.'::text;
    return;
  end if;

  if not _discount.is_active then
    return query select false, 0, false, 'This discount code is no longer active.'::text;
    return;
  end if;

  if _discount.starts_at is not null and _discount.starts_at > now() then
    return query select false, 0, false, 'This discount code is not yet active.'::text;
    return;
  end if;

  if _discount.ends_at is not null and _discount.ends_at < now() then
    return query select false, 0, false, 'This discount code has expired.'::text;
    return;
  end if;

  if _discount.min_subtotal_cents is not null and _subtotal_cents < _discount.min_subtotal_cents then
    return query select false, 0, false, 'Your order does not meet the minimum for this code.'::text;
    return;
  end if;

  if _discount.kind = 'percentage' then
    return query select true, round(_subtotal_cents * (_discount.value / 100.0))::integer, false, null::text;
  elsif _discount.kind = 'fixed_amount' then
    return query select true, least(_subtotal_cents, _discount.value::integer), false, null::text;
  elsif _discount.kind = 'free_shipping' then
    return query select true, 0, true, null::text;
  else
    return query select false, 0, false, 'Unsupported discount type.'::text;
  end if;
end;
$$;

grant execute on function validate_discount_code(text, integer) to anon, authenticated;
