-- Batch 18: privacy-conscious commerce analytics.
--
-- Privacy design (worth stating explicitly since Batch 19's security audit
-- will look at this table):
--   - No IP address, user-agent, or device fingerprinting is stored.
--   - `session_id` is a random UUID the client generates and keeps in
--     localStorage — it identifies a browsing session, not a person. It's
--     never linked to an email/name unless the visitor is signed in, in
--     which case `profile_id` links it the same way any other first-party
--     data already does (their orders, reviews, etc.).
--   - `data` only ever holds the specific fields each event type needs
--     (a product id, a search query, a cart quantity) — never free-text
--     PII.
--   - INSERT is intentionally open (`with check (true)`): a session_id is
--     self-reported and unverifiable pre-auth, same trust model as any
--     client-side analytics beacon (GA, Segment, etc.) — there's no
--     money or personal data at stake in a spammed event, unlike orders/
--     payments/discounts which all go through SECURITY DEFINER RPCs with
--     real server-side validation. SELECT is staff-only.

create type analytics_event_type as enum (
  'page_view', 'product_view', 'search', 'add_to_cart', 'remove_from_cart',
  'checkout_started', 'payment_started', 'purchase', 'wishlist', 'newsletter_signup'
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  type analytics_event_type not null,
  session_id text not null,
  profile_id uuid references profiles (id) on delete set null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index analytics_events_type_created_idx on analytics_events (type, created_at);
create index analytics_events_session_idx on analytics_events (session_id);
create index analytics_events_created_idx on analytics_events (created_at);

alter table analytics_events enable row level security;

create policy "Anyone can record analytics events" on analytics_events
  for insert with check (true);
create policy "Staff read analytics events" on analytics_events
  for select using (has_any_role('order_manager', 'admin', 'super_admin'));
