-- Batch 14: discount targeting/caps/usage-limits and zone-aware shipping.
--
-- DISCOUNTS
-- `applies_to` (jsonb) already existed but nothing ever read it — every
-- code applied to the whole cart regardless of its contents. `usage_limit`/
-- `usage_count` existed too but usage_count was never incremented, so the
-- limit was decorative. This migration makes both real:
--   - compute_discount_eligible_cents() sums only the cart lines that match
--     applies_to ({"all":true} | {"product_ids":[...]} | {"collection_ids":[...]}).
--   - compute_discount_cents() applies the percentage/fixed math and caps
--     the result at the new max_discount_cents.
--   - create_order atomically increments usage_count with a conditional
--     UPDATE ("...WHERE usage_count < usage_limit RETURNING id"), the same
--     race-safe pattern used for inventory in migration 0024 — two
--     concurrent checkouts racing for the last use of a limited code can't
--     both win.
--   - discount_redemptions records who used what, when, enabling a new
--     per-customer cap (profile_id for signed-in shoppers, email for
--     guests, since a guest has no profile_id to key off of).
--
-- SHIPPING
-- Zones previously only matched by country, and nothing ever actually
-- restricted which shipping_methods a destination could see — the client
-- listed every active method globally. resolve_shipping_zone() adds
-- city-level precedence (a zone with `cities` set beats a country-wide
-- zone) so Accra/Tema can have their own rates distinct from the rest of
-- Ghana, with a single is_default zone (International) catching everything
-- else — extensible to more city- or country-specific zones later without
-- changing the matching logic. create_order now rejects a shipping_method
-- whose zone doesn't match the order's own destination.

alter table discounts
  add column max_discount_cents integer check (max_discount_cents >= 0),
  add column per_customer_limit integer check (per_customer_limit > 0);

create table discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references discounts (id),
  discount_code_id uuid not null references discount_codes (id),
  order_id uuid not null references orders (id) on delete cascade,
  profile_id uuid references profiles (id) on delete set null,
  email citext not null,
  discount_cents integer not null check (discount_cents >= 0),
  created_at timestamptz not null default now(),
  unique (discount_id, order_id)
);
create index discount_redemptions_discount_id_idx on discount_redemptions (discount_id);
create index discount_redemptions_profile_id_idx on discount_redemptions (profile_id);
create index discount_redemptions_email_idx on discount_redemptions (email);

alter table discount_redemptions enable row level security;
create policy "Order staff read discount_redemptions" on discount_redemptions
  for select using (has_any_role('order_manager', 'admin', 'super_admin'));

alter table shipping_zones
  add column cities text[],
  add column is_default boolean not null default false;

-- At most one default (catch-all) zone at a time.
create unique index shipping_zones_single_default_idx on shipping_zones ((is_default)) where is_default;

-- ============================================================
-- resolve_shipping_zone — city-specific zones win over a country-wide
-- zone, which wins over the single is_default catch-all.
-- ============================================================
create or replace function resolve_shipping_zone(_country_code text, _city text default null)
returns uuid
language sql
stable
as $$
  select id from (
    select id, 1 as priority from shipping_zones
    where _city is not null and cities is not null and array_length(cities, 1) > 0
      and _country_code = any(country_codes)
      and lower(_city) = any(select lower(c) from unnest(cities) as c)
    union all
    select id, 2 as priority from shipping_zones
    where (cities is null or array_length(cities, 1) = 0)
      and _country_code = any(country_codes)
    union all
    select id, 3 as priority from shipping_zones where is_default
  ) matches
  order by priority
  limit 1;
$$;

grant execute on function resolve_shipping_zone(text, text) to anon, authenticated;

-- ============================================================
-- Reseed shipping zones/methods around Ghana-first geography. No table
-- references shipping_zones/shipping_methods by id (orders only snapshot
-- shipping_cents, never a method FK — see 0006_orders.sql), so replacing
-- the rows outright is safe.
-- ============================================================
delete from shipping_methods;
delete from shipping_zones;

insert into shipping_zones (id, name, country_codes, cities, is_default) values
  ('65000000-0000-0000-0000-000000000001', 'Accra', array['GH'], array['Accra'], false),
  ('65000000-0000-0000-0000-000000000002', 'Tema', array['GH'], array['Tema'], false),
  ('65000000-0000-0000-0000-000000000003', 'Other Ghana', array['GH'], null, false),
  ('65000000-0000-0000-0000-000000000004', 'International', array[]::text[], null, true);

insert into shipping_methods (zone_id, name, price_cents, min_order_cents, min_delivery_days, max_delivery_days) values
  ('65000000-0000-0000-0000-000000000001', 'Accra Standard', 300, null, 2, 3),
  ('65000000-0000-0000-0000-000000000001', 'Accra Express', 500, null, 1, 2),
  ('65000000-0000-0000-0000-000000000002', 'Tema Standard', 400, null, 2, 4),
  ('65000000-0000-0000-0000-000000000003', 'Ghana Standard Delivery', 600, null, 3, 5),
  ('65000000-0000-0000-0000-000000000004', 'International Standard', 2500, null, 7, 14),
  ('65000000-0000-0000-0000-000000000004', 'International Express', 4500, null, 3, 5);

-- ============================================================
-- Discount eligibility helpers, shared by validate_discount_code (cart
-- preview) and create_order (source of truth) so the two can never diverge.
-- ============================================================
create or replace function compute_discount_eligible_cents(_cart_id uuid, _applies_to jsonb)
returns integer
language sql
stable
as $$
  select coalesce(sum(pv.price_cents * ci.quantity), 0)::integer
  from cart_items ci
  join product_variants pv on pv.id = ci.variant_id
  join products p on p.id = pv.product_id
  where ci.cart_id = _cart_id
    and (
      coalesce((_applies_to->>'all')::boolean, false)
      or (
        _applies_to ? 'product_ids'
        and p.id::text in (select jsonb_array_elements_text(_applies_to->'product_ids'))
      )
      or (
        _applies_to ? 'collection_ids'
        and exists (
          select 1 from collection_products cp
          where cp.product_id = p.id
            and cp.collection_id::text in (select jsonb_array_elements_text(_applies_to->'collection_ids'))
        )
      )
    );
$$;

create or replace function compute_discount_cents(_kind discount_kind, _value numeric, _eligible_cents integer, _max_discount_cents integer)
returns integer
language sql
immutable
as $$
  select case
    when _kind = 'percentage' then
      least(round(_eligible_cents * (_value / 100.0))::integer, coalesce(_max_discount_cents, _eligible_cents))
    when _kind = 'fixed_amount' then
      least(_eligible_cents, _value::integer, coalesce(_max_discount_cents, _value::integer))
    else 0
  end;
$$;

drop function if exists validate_discount_code(text, integer);

-- ============================================================
-- validate_discount_code — cart-page preview. Read-only: never increments
-- usage or writes a redemption (that only happens once an order is
-- actually placed, in create_order below). Returns discount_id/
-- discount_code_id too so create_order can reuse this same validation
-- instead of re-deriving it.
-- ============================================================
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
    select count(*) into _customer_uses from discount_redemptions
    where discount_id = _discount.id and profile_id = _profile_id;
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
-- create_order — full rewrite: reuses validate_discount_code for the
-- discount math (so cart preview and the actual charge can never
-- disagree), adds the per-customer email check for guests, atomically
-- enforces usage limits, records the redemption, and now validates the
-- chosen shipping_method actually belongs to the zone matching the
-- destination address instead of accepting any active method.
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
        select count(*) into _customer_uses from discount_redemptions
        where discount_id = _discount.id and profile_id is null and lower(email) = lower(_email);
        if _customer_uses >= _discount.per_customer_limit then
          raise exception 'This discount code has already been used with this email address.';
        end if;
      end if;

      -- Atomic conditional increments close the race window between two
      -- concurrent checkouts both redeeming the last remaining use.
      update discounts set usage_count = usage_count + 1
      where id = _discount.id and (usage_limit is null or usage_count < usage_limit)
      returning id into _discount_id_check;
      if _discount_id_check is null then
        raise exception 'This discount code has reached its usage limit.';
      end if;

      if _code_row.usage_limit is not null then
        update discount_codes set usage_count = usage_count + 1
        where id = _code_row.id and usage_count < usage_limit
        returning id into _code_id_check;
        if _code_id_check is null then
          raise exception 'This discount code has reached its usage limit.';
        end if;
      end if;

      _discount_cents := _discount_result.discount_cents;
      _free_shipping := _discount_result.free_shipping;
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

  if _discount.id is not null then
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

  return jsonb_build_object('order_id', _order_id, 'order_number', (select order_number from orders where id = _order_id), 'total_cents', _total_cents, 'currency', _cart.currency);
end;
$$;

grant execute on function create_order(uuid, citext, jsonb, uuid, text) to anon, authenticated;
