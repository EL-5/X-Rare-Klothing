-- Fix: validate_discount_code's RETURNS TABLE declares an OUT column named
-- `discount_id`, which becomes an implicit PL/pgSQL variable of that same
-- name inside the function body. The per-customer-limit check's bare
-- `discount_id = _discount.id` was therefore ambiguous between that OUT
-- variable and discount_redemptions.discount_id — caught live: any
-- per-customer-limited code failed for a signed-in shopper with "column
-- reference \"discount_id\" is ambiguous" (42702). Table-aliasing the
-- query resolves it unambiguously to the column.
--
-- Also surfaces discount_cents on create_order's return value. Live
-- concurrency testing confirmed the usage-limit race is handled correctly
-- (the atomic UPDATE...WHERE ensures only one of two simultaneous
-- redemptions ever increments usage_count) — but the *loser* of that race
-- still gets a valid order, just silently without the discount, since a
-- no-longer-valid code isn't a checkout-blocking error. The client needs a
-- way to notice that happened so it can tell the customer, instead of
-- them discovering it only by re-adding the numbers themselves.

create or replace function validate_discount_code(_code text, _cart_id uuid)
returns table (
  valid boolean, discount_cents integer, free_shipping boolean, message text,
  discount_id uuid, discount_code_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _discount discounts%rowtype;
  _code_row discount_codes%rowtype;
  _subtotal_cents integer;
  _eligible_cents integer;
  _profile_id uuid := auth.uid();
  _customer_uses integer;
begin
  select dc.* into _code_row from discount_codes dc where lower(dc.code) = lower(_code) limit 1;
  if not found then
    return query select false, 0, false, 'Invalid discount code.'::text, null::uuid, null::uuid; return;
  end if;
  select d.* into _discount from discounts d where d.id = _code_row.discount_id;

  if not _discount.is_active then
    return query select false, 0, false, 'This discount code is no longer active.'::text, null::uuid, null::uuid; return;
  end if;
  if _discount.starts_at is not null and _discount.starts_at > now() then
    return query select false, 0, false, 'This discount code is not yet active.'::text, null::uuid, null::uuid; return;
  end if;
  if _discount.ends_at is not null and _discount.ends_at < now() then
    return query select false, 0, false, 'This discount code has expired.'::text, null::uuid, null::uuid; return;
  end if;

  select coalesce(sum(pv.price_cents * ci.quantity), 0) into _subtotal_cents
  from cart_items ci join product_variants pv on pv.id = ci.variant_id where ci.cart_id = _cart_id;

  if _discount.min_subtotal_cents is not null and _subtotal_cents < _discount.min_subtotal_cents then
    return query select false, 0, false, 'Your order does not meet the minimum for this code.'::text, null::uuid, null::uuid; return;
  end if;

  if _discount.usage_limit is not null and _discount.usage_count >= _discount.usage_limit then
    return query select false, 0, false, 'This discount code has reached its usage limit.'::text, null::uuid, null::uuid; return;
  end if;
  if _code_row.usage_limit is not null and _code_row.usage_count >= _code_row.usage_limit then
    return query select false, 0, false, 'This discount code has reached its usage limit.'::text, null::uuid, null::uuid; return;
  end if;

  if _discount.per_customer_limit is not null and _profile_id is not null then
    select count(*) into _customer_uses from discount_redemptions dr
    where dr.discount_id = _discount.id and dr.profile_id = _profile_id;
    if _customer_uses >= _discount.per_customer_limit then
      return query select false, 0, false, 'You have already used this discount code.'::text, null::uuid, null::uuid; return;
    end if;
  end if;

  if _discount.kind = 'free_shipping' then
    return query select true, 0, true, null::text, _discount.id, _code_row.id; return;
  end if;

  _eligible_cents := compute_discount_eligible_cents(_cart_id, _discount.applies_to);
  if _eligible_cents <= 0 then
    return query select false, 0, false, 'This code does not apply to the items in your cart.'::text, null::uuid, null::uuid; return;
  end if;

  return query select
    true,
    compute_discount_cents(_discount.kind, _discount.value, _eligible_cents, _discount.max_discount_cents),
    false, null::text, _discount.id, _code_row.id;
end;
$$;

grant execute on function validate_discount_code(text, uuid) to anon, authenticated;

-- ============================================================
-- create_order — same body as migration 0026, plus:
--   - table-aliased discount_redemptions query (defensive, matching the
--     fix above even though create_order has no colliding OUT param)
--   - discount_cents added to the returned jsonb
-- ============================================================
create or replace function create_order(
  _cart_id uuid,
  _email citext,
  _shipping_address jsonb,
  _shipping_method_id uuid,
  _customer_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _profile_id uuid := auth.uid();
  _cart carts%rowtype;
  _item record;
  _available integer;
  _subtotal_cents integer := 0;
  _discount_cents integer := 0;
  _shipping_cents integer := 0;
  _tax_cents integer := 0;
  _total_cents integer := 0;
  _order_id uuid;
  _shipping_method shipping_methods%rowtype;
  _zone_id uuid;
  _free_shipping boolean := false;
  _discount_result record;
  _discount discounts%rowtype;
  _code_row discount_codes%rowtype;
  _customer_uses integer;
  _discount_id_check uuid;
  _code_id_check uuid;
  _tax_rate tax_rates%rowtype;
  _item_count integer := 0;
begin
  if _email is null or _email = '' then
    raise exception 'Email is required.';
  end if;
  if coalesce(_shipping_address->>'first_name', '') = '' or coalesce(_shipping_address->>'last_name', '') = ''
     or coalesce(_shipping_address->>'address1', '') = '' or coalesce(_shipping_address->>'city', '') = ''
     or coalesce(_shipping_address->>'country_code', '') = '' then
    raise exception 'Shipping address is incomplete.';
  end if;

  select * into _cart from carts where id = _cart_id;
  if not found then
    raise exception 'Cart not found.';
  end if;
  if _cart.profile_id is not null and _cart.profile_id <> _profile_id then
    raise exception 'This cart does not belong to you.';
  end if;

  -- Lock each involved variant's inventory row for the duration of this
  -- transaction before checking availability, so a second concurrent
  -- create_order for the same variant blocks until this one commits (and
  -- then sees the post-reservation available count) instead of racing it.
  for _item in
    select ci.id as cart_item_id, ci.variant_id, ci.quantity, pv.price_cents, pv.is_active as variant_active,
           pv.product_id, p.name as product_name, p.status as product_status
    from cart_items ci
    join product_variants pv on pv.id = ci.variant_id
    join products p on p.id = pv.product_id
    where ci.cart_id = _cart_id
    order by ci.variant_id -- stable lock order across concurrent transactions avoids deadlocks
  loop
    _item_count := _item_count + 1;

    if _item.product_status <> 'active' or not _item.variant_active then
      raise exception '% is no longer available.', _item.product_name;
    end if;

    select available into _available from inventory where variant_id = _item.variant_id for update;
    if _available is null or _available < _item.quantity then
      raise exception 'Not enough stock available for %.', _item.product_name;
    end if;

    _subtotal_cents := _subtotal_cents + (_item.price_cents * _item.quantity);
  end loop;

  if _item_count = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if _cart.discount_code is not null then
    select * into _discount_result from validate_discount_code(_cart.discount_code, _cart_id);
    if _discount_result.valid then
      select d.* into _discount from discounts d where d.id = _discount_result.discount_id;
      select dc.* into _code_row from discount_codes dc where dc.id = _discount_result.discount_code_id;

      -- validate_discount_code already checked the per-customer limit for a
      -- signed-in shopper (by profile_id). A guest has no profile_id at
      -- cart-preview time, so re-check here by email now that we have one.
      if _discount.per_customer_limit is not null and _profile_id is null then
        select count(*) into _customer_uses from discount_redemptions dr
        where dr.discount_id = _discount.id and dr.profile_id is null and lower(dr.email) = lower(_email);
        if _customer_uses >= _discount.per_customer_limit then
          raise exception 'This discount code has already been used with this email address.';
        end if;
      end if;

      -- Atomic conditional increments close the race window between two
      -- concurrent checkouts both redeeming the last remaining use. The
      -- loser doesn't fail checkout outright (an expired/exhausted code
      -- isn't a reason to block the sale) — it just doesn't get the
      -- discount, which is why the response always reports the discount
      -- actually applied rather than assuming the cart's expected amount.
      update discounts set usage_count = usage_count + 1
      where id = _discount.id and (usage_limit is null or usage_count < usage_limit)
      returning id into _discount_id_check;

      if _discount_id_check is not null and _code_row.usage_limit is not null then
        update discount_codes set usage_count = usage_count + 1
        where id = _code_row.id and usage_count < usage_limit
        returning id into _code_id_check;
        if _code_id_check is null then
          -- The discount-level increment above already committed to this
          -- statement's transaction; undo it since the code-level limit
          -- (a separate, tighter cap) rejects this redemption.
          update discounts set usage_count = usage_count - 1 where id = _discount.id;
          _discount_id_check := null;
        end if;
      end if;

      if _discount_id_check is not null then
        _discount_cents := _discount_result.discount_cents;
        _free_shipping := _discount_result.free_shipping;
      end if;
    end if;
  end if;

  select * into _shipping_method from shipping_methods where id = _shipping_method_id and is_active = true;
  if not found then
    raise exception 'Selected shipping method is not available.';
  end if;

  _zone_id := resolve_shipping_zone(_shipping_address->>'country_code', _shipping_address->>'city');
  if _zone_id is null or _shipping_method.zone_id <> _zone_id then
    raise exception 'Selected shipping method is not available for this destination.';
  end if;

  if _shipping_method.min_order_cents is not null and (_subtotal_cents - _discount_cents) < _shipping_method.min_order_cents then
    raise exception 'Selected shipping method is not available for this order.';
  end if;
  _shipping_cents := case when _free_shipping then 0 else _shipping_method.price_cents end;

  select * into _tax_rate from tax_rates where country_code = (_shipping_address->>'country_code') and region = (_shipping_address->>'region');
  if not found then
    select * into _tax_rate from tax_rates where country_code = (_shipping_address->>'country_code') and region is null;
  end if;
  if found then
    _tax_cents := round((_subtotal_cents - _discount_cents + case when _tax_rate.is_shipping_taxable then _shipping_cents else 0 end) * _tax_rate.rate)::integer;
  else
    _tax_cents := 0;
  end if;

  _total_cents := (_subtotal_cents - _discount_cents) + _shipping_cents + _tax_cents;

  insert into orders (profile_id, email, status, currency, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, discount_code, customer_notes, inventory_reserved)
  values (_profile_id, _email, 'pending', _cart.currency, _subtotal_cents, _discount_cents, _shipping_cents, _tax_cents, _total_cents, _cart.discount_code, _customer_notes, true)
  returning id into _order_id;

  if _discount_id_check is not null then
    insert into discount_redemptions (discount_id, discount_code_id, order_id, profile_id, email, discount_cents)
    values (_discount.id, _code_row.id, _order_id, _profile_id, _email, _discount_cents);
  end if;

  for _item in
    select ci.variant_id, ci.quantity, pv.price_cents, pv.sku, pv.size, pv.color, pv.product_id, p.name as product_name
    from cart_items ci
    join product_variants pv on pv.id = ci.variant_id
    join products p on p.id = pv.product_id
    where ci.cart_id = _cart_id
  loop
    insert into order_items (order_id, variant_id, product_id, product_name, variant_title, sku, image_url, unit_price_cents, quantity, total_cents)
    values (
      _order_id, _item.variant_id, _item.product_id, _item.product_name,
      nullif(concat_ws(' / ', _item.color, _item.size), ''),
      _item.sku,
      (select url from product_images where product_id = _item.product_id order by position limit 1),
      _item.price_cents, _item.quantity, _item.price_cents * _item.quantity
    );

    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'reservation', _item.quantity, 'Checkout reservation', 'order', _order_id);
  end loop;

  insert into order_addresses (order_id, type, first_name, last_name, company, address1, address2, city, region, postal_code, country_code, phone)
  values (
    _order_id, 'shipping',
    _shipping_address->>'first_name', _shipping_address->>'last_name', nullif(_shipping_address->>'company', ''),
    _shipping_address->>'address1', nullif(_shipping_address->>'address2', ''), _shipping_address->>'city',
    nullif(_shipping_address->>'region', ''), nullif(_shipping_address->>'postal_code', ''),
    _shipping_address->>'country_code', nullif(_shipping_address->>'phone', '')
  );
  insert into order_addresses (order_id, type, first_name, last_name, company, address1, address2, city, region, postal_code, country_code, phone)
  values (
    _order_id, 'billing',
    _shipping_address->>'first_name', _shipping_address->>'last_name', nullif(_shipping_address->>'company', ''),
    _shipping_address->>'address1', nullif(_shipping_address->>'address2', ''), _shipping_address->>'city',
    nullif(_shipping_address->>'region', ''), nullif(_shipping_address->>'postal_code', ''),
    _shipping_address->>'country_code', nullif(_shipping_address->>'phone', '')
  );

  delete from cart_items where cart_id = _cart_id;

  return jsonb_build_object(
    'order_id', _order_id,
    'order_number', (select order_number from orders where id = _order_id),
    'total_cents', _total_cents,
    'discount_cents', _discount_cents,
    'currency', _cart.currency
  );
end;
$$;

grant execute on function create_order(uuid, citext, jsonb, uuid, text) to anon, authenticated;
