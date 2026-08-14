-- Discounts — a discount defines the rule; discount_codes are the
-- redeemable strings that trigger it (a single discount can have several
-- codes, e.g. auto-generated single-use influencer codes).

create table discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind discount_kind not null,
  value numeric(10, 2) not null default 0,
  min_subtotal_cents integer check (min_subtotal_cents >= 0),
  usage_limit integer check (usage_limit > 0),
  usage_count integer not null default 0,
  applies_to jsonb not null default '{"all": true}',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger discounts_set_updated_at
  before update on discounts
  for each row execute function set_updated_at();

create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references discounts (id) on delete cascade,
  code citext not null unique,
  usage_limit integer check (usage_limit > 0),
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index discount_codes_discount_id_idx on discount_codes (discount_id);
