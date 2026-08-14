-- Shipping zones/methods and tax rates.

create table shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_codes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger shipping_zones_set_updated_at
  before update on shipping_zones
  for each row execute function set_updated_at();

create table shipping_methods (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references shipping_zones (id) on delete cascade,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  min_order_cents integer check (min_order_cents >= 0),
  min_delivery_days integer,
  max_delivery_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shipping_methods_zone_id_idx on shipping_methods (zone_id);

create trigger shipping_methods_set_updated_at
  before update on shipping_methods
  for each row execute function set_updated_at();

create table tax_rates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  region text,
  rate numeric(6, 4) not null check (rate >= 0),
  is_shipping_taxable boolean not null default false,
  created_at timestamptz not null default now(),
  unique (country_code, region)
);
