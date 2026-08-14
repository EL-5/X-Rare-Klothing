-- Cart and wishlist.

create table carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete cascade,
  session_id text,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (profile_id is not null or session_id is not null)
);
create index carts_profile_id_idx on carts (profile_id);
create unique index carts_session_id_idx on carts (session_id) where profile_id is null;

create trigger carts_set_updated_at
  before update on carts
  for each row execute function set_updated_at();

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts (id) on delete cascade,
  variant_id uuid not null references product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);
create index cart_items_cart_id_idx on cart_items (cart_id);

create trigger cart_items_set_updated_at
  before update on cart_items
  for each row execute function set_updated_at();

-- One wishlist per customer.
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id, variant_id)
);
create index wishlist_items_wishlist_id_idx on wishlist_items (wishlist_id);
