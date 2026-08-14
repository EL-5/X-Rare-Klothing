-- Orders — must stand on their own historically. order_items snapshots the
-- product/variant name, SKU, and unit price at time of purchase so an order
-- placed today still reads correctly after the product is renamed,
-- repriced, or deleted. Never join back to `products`/`product_variants`
-- to reconstruct what an order "was" — only to see what the product is now.

create sequence order_number_seq start 100001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('HF-' || nextval('order_number_seq')::text),
  profile_id uuid references profiles (id) on delete set null,
  email citext not null,
  status order_status not null default 'pending',
  currency text not null default 'USD',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  discount_code text,
  customer_notes text,
  internal_notes text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_profile_id_idx on orders (profile_id);
create index orders_status_idx on orders (status);
create index orders_email_idx on orders (email);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  -- Nullable + ON DELETE SET NULL: the historical line item must survive
  -- even if the source variant/product is later deleted.
  variant_id uuid references product_variants (id) on delete set null,
  product_id uuid references products (id) on delete set null,
  -- Snapshot fields — authoritative for this order, independent of current catalog state.
  product_name text not null,
  variant_title text,
  sku text not null,
  image_url text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now()
);
create index order_items_order_id_idx on order_items (order_id);

create table order_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  type address_type not null,
  first_name text not null,
  last_name text not null,
  company text,
  address1 text not null,
  address2 text,
  city text not null,
  region text,
  postal_code text,
  country_code text not null,
  phone text,
  unique (order_id, type)
);
