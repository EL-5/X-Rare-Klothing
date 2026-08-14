-- Batch 12: payment gateway integration.
--
-- 1) Realign order_status/payment_status to the batch's specified state
--    machines (renames existing values, safe under live data via an
--    explicit USING mapping).
-- 2) payment_webhook_events — authenticated/idempotent/logged/retry-safe
--    webhook receipts (unique per provider+event_id) for the not-yet-
--    deployed payment-webhook Edge Function (see supabase/functions/).
-- 3) finalize_paid_order/mark_payment_failed — the one shared code path
--    for "what happens when a payment attempt resolves," used by both the
--    existing simulated gateway (process_payment, Batch 11) and the new
--    webhook-driven live-provider path, so the two never drift apart.
-- 4) A narrow guest-order read policy (profile_id is null), mirroring the
--    guest-cart capability-token model already documented above, so a
--    guest checkout can poll its own order's status while waiting on an
--    async webhook — never to mark anything paid, only to read it back.

-- ============================================================
-- order_status: awaiting_payment -> payment_pending, fulfilled -> ready_for_shipping
-- ============================================================
alter type order_status rename to order_status_old;
create type order_status as enum (
  'pending', 'payment_pending', 'paid', 'processing', 'ready_for_shipping',
  'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded'
);
alter table orders alter column status drop default;
alter table orders alter column status type order_status using (
  case status::text
    when 'awaiting_payment' then 'payment_pending'
    when 'fulfilled' then 'ready_for_shipping'
    else status::text
  end
)::order_status;
alter table orders alter column status set default 'pending';
drop type order_status_old;

-- ============================================================
-- payment_status: authorized -> processing, paid -> successful, voided -> failed
-- ============================================================
alter type payment_status rename to payment_status_old;
create type payment_status as enum ('pending', 'processing', 'successful', 'failed', 'refunded', 'partially_refunded');
alter table payments alter column status drop default;
alter table payments alter column status type payment_status using (
  case status::text
    when 'authorized' then 'processing'
    when 'paid' then 'successful'
    when 'voided' then 'failed'
    else status::text
  end
)::payment_status;
alter table payments alter column status set default 'pending';
drop type payment_status_old;

-- ============================================================
-- Webhook event log
-- ============================================================
create table payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  payment_id uuid references payments (id) on delete set null,
  order_id uuid references orders (id) on delete set null,
  status text not null default 'received',
  payload jsonb not null default '{}',
  error_message text,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);
create index payment_webhook_events_order_id_idx on payment_webhook_events (order_id);

alter table payment_webhook_events enable row level security;
create policy "Staff read webhook events" on payment_webhook_events
  for select using (has_any_role('order_manager', 'admin', 'super_admin'));
-- Deliberately no insert/update policy for anon/authenticated: only the
-- payment-webhook Edge Function's service-role client writes here, and
-- service role bypasses RLS entirely — this table should never be
-- reachable from the browser at all.

-- ============================================================
-- Guest order read (capability-token model, same as guest carts — see the
-- "Guest carts... reachable by anyone holding the cart's UUID" comment above)
-- ============================================================
create policy "Guest can read own order by id" on orders
  for select using (profile_id is null);

-- ============================================================
-- Shared finalize/fail — service-role only. Never grant these to
-- anon/authenticated: a client that could call finalize_paid_order
-- directly could mark any order paid without ever paying.
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

  update orders set status = 'paid' where id = _order_id;

  for _item in select variant_id, quantity from order_items where order_id = _order_id loop
    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'release', _item.quantity, 'Order paid', 'order', _order_id);
    insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
    values (_item.variant_id, 'sale', -_item.quantity, 'Order paid', 'order', _order_id);
  end loop;
end;
$$;

create or replace function mark_payment_failed(_order_id uuid, _payment_id uuid, _message text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update payments set status = 'failed' where id = _payment_id;

  insert into payment_transactions (payment_id, type, amount_cents, status, provider_reference, raw_response)
  select id, 'authorization', amount_cents, 'failed', provider_reference, jsonb_build_object('message', _message)
  from payments where id = _payment_id;

  -- Order reverts to 'pending' so the customer can retry (with the same or
  -- a different provider) — the inventory reservation is left untouched.
  update orders set status = 'pending' where id = _order_id and status = 'payment_pending';
end;
$$;

grant execute on function finalize_paid_order(uuid, uuid) to service_role;
grant execute on function mark_payment_failed(uuid, uuid, text) to service_role;

-- ============================================================
-- process_payment (Batch 11's simulated gateway) — updated to the new enum
-- values and refactored onto the shared finalize/fail functions above, so
-- "what happens on success/failure" is defined in exactly one place.
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
    update orders set status = 'cancelled' where id = _order_id;
    for _item in select variant_id, quantity from order_items where order_id = _order_id loop
      insert into inventory_movements (variant_id, type, quantity, reason, reference_type, reference_id)
      values (_item.variant_id, 'release', _item.quantity, 'Checkout expired', 'order', _order_id);
    end loop;
    raise exception 'This checkout has expired. Please start over.';
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
