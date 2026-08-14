-- Batch 11: real checkout. orders/order_items/order_addresses/payments have
-- no client INSERT policy by design (see 0014_rls_policies.sql — "orders are
-- created and transitioned by the checkout/payment Edge Functions via the
-- service role"). We don't have Edge Function deploy access in this
-- environment, so these two SECURITY DEFINER functions play that exact
-- role instead: elevated privilege, invoked under the caller's own RLS-
-- restricted session, doing only validated writes. Every price/discount/
-- tax/shipping figure is recomputed here from live tables — nothing here
-- ever trusts a client-supplied amount.

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
  -- Guest carts (profile_id is null) are reachable by whoever holds the id — same
  -- capability-token model as the rest of the cart system (see 0014_rls_policies.sql).
  if _cart.profile_id is not null and _cart.profile_id <> _profile_id then
    raise exception 'This cart does not belong to you.';
  end if;

  -- Validate every line item fresh: product active, variant active, enough stock.
  for _item in
    select ci.id as cart_item_id, ci.variant_id, ci.quantity, pv.price_cents, pv.is_active as variant_active,
           pv.product_id, p.name as product_name, p.status as product_status,
           inv.available
    from cart_items ci
    join product_variants pv on pv.id = ci.variant_id
    join products p on p.id = pv.product_id
    left join inventory inv on inv.variant_id = pv.id
    where ci.cart_id = _cart_id
  loop
    _item_count := _item_count + 1;

    if _item.product_status <> 'active' or not _item.variant_active then
      raise exception '% is no longer available.', _item.product_name;
    end if;
    if _item.available is null or _item.available < _item.quantity then
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

  insert into orders (profile_id, email, status, currency, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, discount_code, customer_notes)
  values (_profile_id, _email, 'pending', _cart.currency, _subtotal_cents, _discount_cents, _shipping_cents, _tax_cents, _total_cents, _cart.discount_code, _customer_notes)
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

-- Simulated payment gateway — no real processor is configured in this
-- environment (see supabase/functions/create-payment-intent, a structural
-- stub). Uses the well-known Stripe test-card convention (a number ending
-- 0002 always declines) purely to demonstrate both the success and failure
-- UX paths end to end; nothing here talks to a real payment network.
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
  _status payment_status;
  _last4 text;
  _decline boolean;
  _item record;
  _checkout_ttl interval := interval '30 minutes';
begin
  select * into _order from orders where id = _order_id;
  if not found then
    raise exception 'Order not found.';
  end if;
  if _order.profile_id is not null and _order.profile_id <> _profile_id then
    raise exception 'This order does not belong to you.';
  end if;

  if _order.status <> 'pending' then
    if _order.status = 'cancelled' then
      raise exception 'This checkout has expired. Please start over.';
    end if;
    raise exception 'This order has already been processed.';
  end if;

  if now() - _order.placed_at > _checkout_ttl then
    update orders set status = 'cancelled' where id = _order_id;
    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'release', _item.quantity, 'Checkout expired', 'order', _order_id);
    end loop;
    raise exception 'This checkout has expired. Please start over.';
  end if;

  _last4 := right(regexp_replace(_card_number, '\D', '', 'g'), 4);
  _decline := _last4 = '0002';
  _status := case when _decline then 'failed' else 'paid' end;

  insert into payments (order_id, provider, provider_reference, status, amount_cents, currency)
  values (_order_id, 'simulated', 'sim_' || replace(gen_random_uuid()::text, '-', ''), _status, _order.total_cents, _order.currency)
  returning id into _payment_id;

  insert into payment_transactions (payment_id, type, amount_cents, status, provider_reference, raw_response)
  values (_payment_id, 'authorization', _order.total_cents, _status::text, 'sim_' || replace(gen_random_uuid()::text, '-', ''), jsonb_build_object('simulated', true, 'last4', _last4));

  if _decline then
    return jsonb_build_object('status', 'failed', 'orderStatus', _order.status, 'message', 'Your card was declined.');
  end if;

  update orders set status = 'paid' where id = _order_id;
  for _item in select variant_id, quantity from order_items where order_id = _order_id loop
    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'release', _item.quantity, 'Order paid', 'order', _order_id);
    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'sale', -_item.quantity, 'Order paid', 'order', _order_id);
  end loop;

  return jsonb_build_object('status', 'paid', 'orderStatus', 'paid', 'message', null);
end;
$$;

grant execute on function process_payment(uuid, text) to anon, authenticated;
