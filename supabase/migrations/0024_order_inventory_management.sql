-- Batch 13: order management + transaction-safe inventory.
--
-- 1) inventory_available_check — a DB-enforced backstop: reserved can never
--    exceed on_hand, regardless of what application code does. Defense in
--    depth on top of the row-locking added to create_order below.
-- 2) orders.inventory_reserved — tracks whether an order currently holds a
--    live reservation, so a retried payment attempt (after a release) knows
--    to re-check stock and re-reserve rather than skipping straight to
--    another payment attempt against inventory that's no longer held.
-- 3) create_order — now locks each variant's inventory row (SELECT ... FOR
--    UPDATE) before checking availability, closing the race where two
--    concurrent checkouts both read "1 available" and both reserve it.
-- 4) mark_payment_failed — now actually releases the reservation (this
--    batch's explicit "Payment failed -> reservation released", a change
--    from Batch 11's "keep it reserved for retry"); process_payment
--    re-reserves (with the same row-locked check) before a retry attempt.
-- 5) cancel_order / refund_order — admin actions, with inventory handled
--    per the batch's own example: cancellation restores stock "where
--    appropriate" (pre-shipment only — blocked once shipped, since the
--    goods have already left), and refund optionally restocks (an admin
--    judgment call — "according to return policy" isn't a fixed rule the
--    schema can encode, so it's a checkbox the admin sets per refund).

alter table inventory add constraint inventory_available_check check (available >= 0);
alter table orders add column inventory_reserved boolean not null default true;

-- ============================================================
-- create_order — row-locked availability check
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
  _free_shipping boolean := false;
  _discount_result record;
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
    select * into _discount_result from validate_discount_code(_cart.discount_code, _subtotal_cents);
    if _discount_result.valid then
      _discount_cents := _discount_result.discount_cents;
      _free_shipping := _discount_result.free_shipping;
    end if;
  end if;

  select * into _shipping_method from shipping_methods where id = _shipping_method_id and is_active = true;
  if not found then
    raise exception 'Selected shipping method is not available.';
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

-- ============================================================
-- finalize_paid_order — now also clears inventory_reserved (converted to a sale, no longer "reserved")
-- ============================================================
create or replace function finalize_paid_order(_order_id uuid, _payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _item record;
begin
  update payments set status = 'successful' where id = _payment_id;

  insert into payment_transactions (payment_id, type, amount_cents, status, provider_reference, raw_response)
  select id, 'capture', amount_cents, 'successful', provider_reference, '{}'::jsonb
  from payments where id = _payment_id;

  update orders set status = 'paid', inventory_reserved = false where id = _order_id;

  for _item in select variant_id, quantity from order_items where order_id = _order_id loop
    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'release', _item.quantity, 'Order paid', 'order', _order_id);
    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'sale', -_item.quantity, 'Order paid', 'order', _order_id);
  end loop;
end;
$$;

-- ============================================================
-- mark_payment_failed — releases the reservation immediately (Batch 13:
-- "Payment failed -> reservation released"), tracked via inventory_reserved
-- so a retry knows it needs to re-reserve, not just re-attempt payment.
-- ============================================================
create or replace function mark_payment_failed(_order_id uuid, _payment_id uuid, _message text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _item record;
  _was_reserved boolean;
begin
  update payments set status = 'failed' where id = _payment_id;

  insert into payment_transactions (payment_id, type, amount_cents, status, provider_reference, raw_response)
  select id, 'authorization', amount_cents, 'failed', provider_reference, jsonb_build_object('message', _message)
  from payments where id = _payment_id;

  select inventory_reserved into _was_reserved from orders where id = _order_id;

  if _was_reserved then
    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'release', _item.quantity, 'Payment failed', 'order', _order_id);
    end loop;
  end if;

  update orders set status = 'pending', inventory_reserved = false
  where id = _order_id and status = 'payment_pending';
end;
$$;

-- ============================================================
-- process_payment (simulated gateway) — re-reserves on retry if the prior
-- attempt already released stock, using the same row-locked check as
-- create_order so a retry can't oversell either.
-- ============================================================
create or replace function process_payment(_order_id uuid, _card_number text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _order orders%rowtype;
  _profile_id uuid := auth.uid();
  _payment_id uuid;
  _last4 text;
  _decline boolean;
  _checkout_ttl interval := interval '30 minutes';
  _item record;
  _available integer;
begin
  select * into _order from orders where id = _order_id;
  if not found then
    raise exception 'Order not found.';
  end if;
  if _order.profile_id is not null and _order.profile_id <> _profile_id then
    raise exception 'This order does not belong to you.';
  end if;

  if _order.status not in ('pending', 'payment_pending') then
    if _order.status = 'cancelled' then
      raise exception 'This checkout has expired. Please start over.';
    end if;
    raise exception 'This order has already been processed.';
  end if;

  if now() - _order.placed_at > _checkout_ttl then
    if _order.inventory_reserved then
      for _item in select variant_id, quantity from order_items where order_id = _order_id loop
        insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
        values (_item.variant_id, 'release', _item.quantity, 'Checkout expired', 'order', _order_id);
      end loop;
    end if;
    update orders set status = 'cancelled', inventory_reserved = false where id = _order_id;
    raise exception 'This checkout has expired. Please start over.';
  end if;

  -- Retry after a prior failed attempt: the earlier reservation was
  -- already released, so re-check and re-reserve before trying again.
  if not _order.inventory_reserved then
    for _item in
      select variant_id, quantity, product_id from order_items where order_id = _order_id
    loop
      select available into _available from inventory where variant_id = _item.variant_id for update;
      if _available is null or _available < _item.quantity then
        raise exception 'One of the items in this order is no longer available.';
      end if;
    end loop;

    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'reservation', _item.quantity, 'Checkout reservation (retry)', 'order', _order_id);
    end loop;
    update orders set inventory_reserved = true where id = _order_id;
  end if;

  _last4 := right(regexp_replace(_card_number, '\D', '', 'g'), 4);
  _decline := _last4 = '0002';

  insert into payments (order_id, provider, provider_reference, status, amount_cents, currency)
  values (_order_id, 'simulated', 'sim_' || replace(gen_random_uuid()::text, '-', ''), 'pending', _order.total_cents, _order.currency)
  returning id into _payment_id;

  update orders set status = 'payment_pending' where id = _order_id;

  if _decline then
    perform mark_payment_failed(_order_id, _payment_id, 'Your card was declined.');
    return jsonb_build_object('status', 'failed', 'orderStatus', 'pending', 'message', 'Your card was declined.');
  end if;

  perform finalize_paid_order(_order_id, _payment_id);
  return jsonb_build_object('status', 'successful', 'orderStatus', 'paid', 'message', null);
end;
$$;

grant execute on function process_payment(uuid, text) to anon, authenticated;

-- ============================================================
-- cancel_order — staff-only (checked internally, matching the has_any_role
-- pattern used elsewhere, since this is an RPC rather than a table policy).
-- Pre-shipment: releases/restocks depending on whether the sale ledger
-- already recorded it. Blocked once shipped — use refund_order instead.
-- ============================================================
create or replace function cancel_order(_order_id uuid, _reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _order orders%rowtype;
  _item record;
begin
  if not has_any_role('order_manager', 'admin', 'super_admin') then
    raise exception 'Not authorized.';
  end if;

  select * into _order from orders where id = _order_id;
  if not found then
    raise exception 'Order not found.';
  end if;
  if _order.status in ('shipped', 'delivered') then
    raise exception 'This order has already shipped — use a refund instead of cancelling it.';
  end if;
  if _order.status in ('cancelled', 'refunded', 'partially_refunded') then
    raise exception 'This order is already %.', _order.status;
  end if;

  if _order.inventory_reserved then
    -- Never sold yet (still just a reservation) — release it.
    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'release', _item.quantity, coalesce(_reason, 'Order cancelled'), 'order', _order_id);
    end loop;
  elsif _order.status in ('paid', 'processing', 'ready_for_shipping') then
    -- Already converted to a sale (on_hand decremented) but never shipped — restore stock.
    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'return', _item.quantity, coalesce(_reason, 'Order cancelled'), 'order', _order_id);
    end loop;
  end if;

  update orders set status = 'cancelled', inventory_reserved = false, internal_notes = trim(both from concat_ws(E'\n', internal_notes, _reason))
  where id = _order_id;
end;
$$;

grant execute on function cancel_order(uuid, text) to authenticated;

-- ============================================================
-- refund_order — staff-only. Purely financial by default; restocking is an
-- explicit admin choice (_restock) since a refund alone doesn't confirm
-- the physical goods came back — "according to return policy" is a
-- judgment call, not something the schema can decide on its own.
-- ============================================================
create or replace function refund_order(_order_id uuid, _amount_cents integer, _restock boolean default false, _reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _order orders%rowtype;
  _payment payments%rowtype;
  _item record;
  _new_status order_status;
begin
  if not has_any_role('order_manager', 'admin', 'super_admin') then
    raise exception 'Not authorized.';
  end if;

  select * into _order from orders where id = _order_id;
  if not found then
    raise exception 'Order not found.';
  end if;
  if _order.status not in ('paid', 'processing', 'ready_for_shipping', 'shipped', 'delivered', 'partially_refunded') then
    raise exception 'This order cannot be refunded from its current status (%).', _order.status;
  end if;
  if _amount_cents <= 0 or _amount_cents > _order.total_cents then
    raise exception 'Refund amount must be between 0 and the order total.';
  end if;

  select * into _payment from payments where order_id = _order_id and status = 'successful' order by created_at desc limit 1;
  if not found then
    raise exception 'No successful payment found for this order.';
  end if;

  update payments
  set status = case when _amount_cents = amount_cents then 'refunded' else 'partially_refunded' end
  where id = _payment.id;

  insert into payment_transactions (payment_id, type, amount_cents, status, provider_reference, raw_response)
  values (_payment.id, 'refund', _amount_cents, 'successful', _payment.provider_reference, jsonb_build_object('reason', _reason));

  _new_status := case when _amount_cents = _order.total_cents then 'refunded' else 'partially_refunded' end;
  update orders
  set status = _new_status, internal_notes = trim(both from concat_ws(E'\n', internal_notes, coalesce(_reason, 'Refund issued')))
  where id = _order_id;

  if _restock then
    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'return', _item.quantity, coalesce(_reason, 'Refund — restocked'), 'order', _order_id);
    end loop;
  end if;
end;
$$;

grant execute on function refund_order(uuid, integer, boolean, text) to authenticated;
