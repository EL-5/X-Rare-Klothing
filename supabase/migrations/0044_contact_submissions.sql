-- Contact page redesign: a real backend for the contact form instead of a
-- mailto: link. Mirrors newsletter_subscribers' pattern exactly — a plain
-- anon-insert RLS policy (no SECURITY DEFINER function needed, since there's
-- no business logic beyond "store it and notify staff") plus an AFTER INSERT
-- trigger that enqueues a notification through the existing provider-
-- agnostic notification queue (0034), addressed to whatever support_email is
-- currently configured in settings.

create type contact_subject as enum (
  'general_question', 'order_support', 'product_question', 'returns_exchanges',
  'wholesale', 'collaboration', 'press', 'other'
);
create type contact_status as enum ('new', 'in_progress', 'resolved');

create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email citext not null,
  phone text,
  subject contact_subject not null default 'general_question',
  order_number text,
  message text not null check (char_length(message) >= 10),
  status contact_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_submissions_status_idx on contact_submissions (status);
create index contact_submissions_created_at_idx on contact_submissions (created_at desc);

create trigger contact_submissions_set_updated_at
  before update on contact_submissions
  for each row execute function set_updated_at();

alter table contact_submissions enable row level security;

create policy "Anyone can submit a contact message" on contact_submissions
  for insert with check (true);
create policy "Staff can read contact submissions" on contact_submissions
  for select using (has_any_role('customer_support', 'order_manager', 'admin', 'super_admin'));
create policy "Staff can update contact submissions" on contact_submissions
  for update using (has_any_role('customer_support', 'order_manager', 'admin', 'super_admin'));

create trigger audit_contact_submissions
  after update on contact_submissions
  for each row execute function log_audit_event();

-- Admin notification on every new submission, addressed to the currently
-- configured support inbox (falls back to a fixed address if unset, same
-- fallback text already used client-side in Contact.tsx pre-redesign).
create or replace function notify_on_contact_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _recipient citext;
begin
  select coalesce(value #>> '{}', 'support@x-rare.com')::citext into _recipient
  from settings where key = 'support_email';

  if _recipient is null then
    _recipient := 'support@x-rare.com';
  end if;

  perform enqueue_notification('contact_submission', _recipient, jsonb_build_object(
    'first_name', new.first_name,
    'last_name', new.last_name,
    'email', new.email,
    'subject', new.subject,
    'message', new.message
  ));
  return new;
end;
$$;

create trigger contact_submissions_notify
  after insert on contact_submissions
  for each row execute function notify_on_contact_submission();

-- Extend render_notification with the new type — same shell, just a new
-- content branch (see 0034 for why this is the only place templates live).
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
    when 'contact_submission' then
      _content_subject := 'New Contact Message — ' || coalesce(_data->>'subject', 'General Question');
      _content_body := '<p>New message from <strong>' || coalesce(_data->>'first_name', '') || ' ' || coalesce(_data->>'last_name', '') ||
        '</strong> (' || coalesce(_data->>'email', '') || '):</p><p>' || coalesce(_data->>'message', '') || '</p>';
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
