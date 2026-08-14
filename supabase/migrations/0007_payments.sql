-- Payments — one order can have multiple payment attempts (e.g. a failed
-- card followed by a successful one); each payment has its own append-only
-- transaction log from the provider (authorize, capture, refund, void).

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null,
  provider_reference text,
  status payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_id_idx on payments (order_id);

create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments (id) on delete cascade,
  type text not null check (type in ('authorization', 'capture', 'refund', 'void')),
  amount_cents integer not null check (amount_cents >= 0),
  status text not null,
  provider_reference text,
  raw_response jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index payment_transactions_payment_id_idx on payment_transactions (payment_id);
