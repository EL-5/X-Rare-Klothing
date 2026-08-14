-- Batch 17: a provider-agnostic notification system. `notifications` is the
-- durable queue and status ledger; `enqueue_notification` is the only way
-- a row gets created (never a direct client insert); `process_pending_
-- notifications` is the only thing that "sends" (renders + simulates
-- delivery via a swappable provider boundary) and is safe to call
-- repeatedly/concurrently — see its comment below.
--
-- No email provider is deployed in this environment (Edge Functions are
-- blocked here — see prior batches), so actual delivery is simulated the
-- same way payments were in Batch 11: a recipient address containing
-- "+faildelivery" always fails, everything else "sends" successfully and
-- the rendered subject/body is persisted on the row so it's inspectable.
-- Swapping in a real provider later (Resend, Postgres, via pg_net, or an
-- Edge Function once deployable) means replacing the single block marked
-- below — no business-logic caller changes, since they only ever call
-- enqueue_notification.

create type notification_type as enum (
  'account_verification', 'password_reset', 'order_confirmation', 'payment_confirmation',
  'order_processing', 'order_shipped', 'order_delivered', 'refund', 'newsletter'
);
create type notification_status as enum ('pending', 'sent', 'failed');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type notification_type not null,
  recipient_email citext not null,
  status notification_status not null default 'pending',
  subject text,
  body text,
  -- Template input, not raw HTML — kept so a retry re-renders from the same
  -- data rather than needing to look anything up again.
  data jsonb not null default '{}',
  related_order_id uuid references orders (id) on delete set null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);
create index notifications_status_idx on notifications (status);
create index notifications_type_idx on notifications (type);
create index notifications_recipient_idx on notifications (recipient_email);
create index notifications_related_order_idx on notifications (related_order_id);

create trigger notifications_set_updated_at
  before update on notifications
  for each row execute function set_updated_at();

alter table notifications enable row level security;

create policy "Staff read notifications" on notifications
  for select using (has_any_role('order_manager', 'customer_support', 'admin', 'super_admin'));
-- No insert/update policy for anon/authenticated — every write goes
-- through enqueue_notification / process_pending_notifications, both
-- SECURITY DEFINER.

-- ============================================================
-- render_notification — the "reusable branding" layer: every type shares
-- the same black header / cream footer shell, only the middle content
-- differs per type. Adding a new notification type means adding one
-- branch here, not a new template file per provider.
-- ============================================================
create or replace function render_notification(_type notification_type, _data jsonb)
returns table (subject text, body text)
language plpgsql
immutable
as $$
declare
  _content_subject text;
  _content_body text;
begin
  case _type
    when 'account_verification' then
      _content_subject := 'Verify your X-Rare account';
      _content_body := '<p>Welcome to X-Rare. Please verify your email address to activate your account.</p>';
    when 'password_reset' then
      _content_subject := 'Reset your X-Rare password';
      _content_body := '<p>We received a request to reset your password. If this wasn''t you, you can safely ignore this email.</p>';
    when 'order_confirmation' then
      _content_subject := 'Order Confirmed — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>Thanks for your order! We''ve received order <strong>' || coalesce(_data->>'order_number', '') ||
        '</strong> for ' || coalesce(_data->>'total', '') || '. We''ll email you again once it ships.</p>';
    when 'payment_confirmation' then
      _content_subject := 'Payment Received — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>We''ve successfully received your payment of ' || coalesce(_data->>'total', '') ||
        ' for order <strong>' || coalesce(_data->>'order_number', '') || '</strong>.</p>';
    when 'order_processing' then
      _content_subject := 'Your Order Is Being Prepared — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>Order <strong>' || coalesce(_data->>'order_number', '') || '</strong> is now being prepared for shipment.</p>';
    when 'order_shipped' then
      _content_subject := 'Your Order Has Shipped — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>Order <strong>' || coalesce(_data->>'order_number', '') || '</strong> is on its way.</p>';
    when 'order_delivered' then
      _content_subject := 'Delivered — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>Order <strong>' || coalesce(_data->>'order_number', '') || '</strong> has been delivered. We hope you love it.</p>';
    when 'refund' then
      _content_subject := 'Refund Processed — ' || coalesce(_data->>'order_number', '');
      _content_body := '<p>A refund of ' || coalesce(_data->>'amount', '') || ' has been issued for order <strong>' ||
        coalesce(_data->>'order_number', '') || '</strong>.</p>';
    when 'newsletter' then
      _content_subject := 'Welcome to X-Rare';
      _content_body := '<p>You''re on the list. Watch your inbox for drops, offers, and rare finds.</p>';
    else
      _content_subject := 'X-Rare';
      _content_body := '';
  end case;

  return query select
    _content_subject,
    '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">' ||
    '<div style="background:#0A0A0A;padding:24px;text-align:center;"><span style="color:#ffffff;font-size:20px;letter-spacing:2px;font-weight:600;">X-RARE</span></div>' ||
    '<div style="padding:32px 24px;color:#0A0A0A;line-height:1.6;">' || _content_body || '</div>' ||
    '<div style="padding:16px 24px;background:#F5F3EE;text-align:center;color:#666666;font-size:12px;">© ' ||
    extract(year from now())::text || ' X-Rare. All rights reserved.</div>' ||
    '</div>';
end;
$$;

-- ============================================================
-- enqueue_notification — the only write path into `notifications`.
-- Business logic (order paid, order shipped, refund issued, ...) calls
-- this; it never talks to a provider or renders anything itself, so
-- swapping how delivery actually happens never touches these call sites.
-- ============================================================
create or replace function enqueue_notification(
  _type notification_type, _recipient_email citext, _data jsonb default '{}', _related_order_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _id uuid;
begin
  insert into notifications (type, recipient_email, data, related_order_id)
  values (_type, _recipient_email, _data, _related_order_id)
  returning id into _id;
  return _id;
end;
$$;

-- ============================================================
-- process_pending_notifications — retry-safe queue processing.
-- `for update skip locked` is what makes this safe to call concurrently
-- (an admin clicking "Process Queue" twice, or a future scheduled job
-- overlapping a manual run): each call only ever claims rows nobody else
-- currently has locked, so no row is ever sent twice. A 'failed' row with
-- attempts < max_attempts is picked up again on the next call — that's the
-- entire retry mechanism, no separate "retry" codepath needed.
-- ============================================================
create or replace function process_pending_notifications(_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _row record;
  _processed integer := 0;
  _rendered record;
  _simulated_failure boolean;
begin
  if not has_any_role('order_manager', 'customer_support', 'admin', 'super_admin') then
    raise exception 'Not authorized.';
  end if;

  for _row in
    select * from notifications
    where status = 'pending' or (status = 'failed' and attempts < max_attempts)
    order by created_at
    limit _limit
    for update skip locked
  loop
    select * into _rendered from render_notification(_row.type, _row.data);

    -- ---- simulated provider boundary (swap this block for a real send) ----
    _simulated_failure := _row.recipient_email ilike '%+faildelivery%';
    -- -------------------------------------------------------------------

    if _simulated_failure then
      update notifications
      set status = 'failed', attempts = attempts + 1, last_error = 'Simulated delivery failure',
          subject = _rendered.subject, body = _rendered.body
      where id = _row.id;
    else
      update notifications
      set status = 'sent', attempts = attempts + 1, sent_at = now(), last_error = null,
          subject = _rendered.subject, body = _rendered.body
      where id = _row.id;
    end if;

    _processed := _processed + 1;
  end loop;

  return _processed;
end;
$$;

grant execute on function process_pending_notifications(integer) to authenticated;

-- ============================================================
-- Order-lifecycle hooks
-- ============================================================

create or replace function finalize_paid_order(_order_id uuid, _payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _item record;
  _order orders%rowtype;
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

  select * into _order from orders where id = _order_id;
  perform enqueue_notification('order_confirmation', _order.email,
    jsonb_build_object('order_number', _order.order_number, 'total', to_char(_order.total_cents / 100.0, 'FM999999990.00')), _order_id);
  perform enqueue_notification('payment_confirmation', _order.email,
    jsonb_build_object('order_number', _order.order_number, 'total', to_char(_order.total_cents / 100.0, 'FM999999990.00')), _order_id);
end;
$$;

create or replace function notify_on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'processing' then
    perform enqueue_notification('order_processing', new.email, jsonb_build_object('order_number', new.order_number), new.id);
  elsif new.status = 'shipped' then
    perform enqueue_notification('order_shipped', new.email, jsonb_build_object('order_number', new.order_number), new.id);
  elsif new.status = 'delivered' then
    perform enqueue_notification('order_delivered', new.email, jsonb_build_object('order_number', new.order_number), new.id);
  end if;

  return new;
end;
$$;

create trigger orders_notify_status_change
  after update of status on orders
  for each row execute function notify_on_order_status_change();

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
  set status = (case when _amount_cents = amount_cents then 'refunded' else 'partially_refunded' end)::payment_status
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

  perform enqueue_notification('refund', _order.email,
    jsonb_build_object('order_number', _order.order_number, 'amount', to_char(_amount_cents / 100.0, 'FM999999990.00')), _order_id);
end;
$$;

grant execute on function refund_order(uuid, integer, boolean, text) to authenticated;

-- ============================================================
-- Newsletter welcome notification
-- ============================================================
create or replace function notify_on_newsletter_subscribe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform enqueue_notification('newsletter', new.email, jsonb_build_object('first_name', new.first_name));
  return new;
end;
$$;

create trigger newsletter_subscribers_notify
  after insert on newsletter_subscribers
  for each row execute function notify_on_newsletter_subscribe();
