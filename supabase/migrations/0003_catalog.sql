-- Catalog: categories, products, options/variants, images, collections.

-- ============================================================
-- Categories (single hierarchy — a product has at most one primary category)
-- ============================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories (id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  image text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_id_idx on categories (parent_id);

create trigger categories_set_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- ============================================================
-- Products
-- ============================================================

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sku text unique,
  status product_status not null default 'draft',
  brand text,
  category_id uuid references categories (id) on delete set null,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  metadata jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on products (category_id);
create index products_status_idx on products (status);
create index products_tags_idx on products using gin (tags);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ============================================================
-- Product options (e.g. "Color", "Size", "Material") and their values.
-- Generic/extensible, in addition to the first-class size/color/material
-- columns on product_variants below (see 0003 note in docs/database.md
-- for why both exist).
-- ============================================================

create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  unique (product_id, name)
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references product_options (id) on delete cascade,
  value text not null,
  position integer not null default 0,
  unique (option_id, value)
);

-- ============================================================
-- Product variants — the actual purchasable/sellable unit. Price, cost,
-- and physical attributes all live here, not on the parent product.
-- ============================================================

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku text not null unique,
  barcode text,
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  cost_cents integer check (cost_cents >= 0),
  size text,
  color text,
  material text,
  weight_grams numeric(10, 2),
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_id_idx on product_variants (product_id);

create trigger product_variants_set_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

-- Links a variant to the generic option values that define it
-- (e.g. variant "Black / M" -> {Color: Black, Size: M}).
create table product_variant_options (
  variant_id uuid not null references product_variants (id) on delete cascade,
  option_value_id uuid not null references product_option_values (id) on delete cascade,
  primary key (variant_id, option_value_id)
);

-- ============================================================
-- Product images — belong to a product, optionally pinned to one variant
-- (e.g. the images for the "Black" colorway).
-- ============================================================

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  variant_id uuid references product_variants (id) on delete set null,
  url text not null,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_id_idx on product_images (product_id);
create index product_images_variant_id_idx on product_images (variant_id);

-- ============================================================
-- Collections (many-to-many marketing groupings, independent of category)
-- ============================================================

create table collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  image text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger collections_set_updated_at
  before update on collections
  for each row execute function set_updated_at();

create table collection_products (
  collection_id uuid not null references collections (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  position integer not null default 0,
  primary key (collection_id, product_id)
);
create index collection_products_product_id_idx on collection_products (product_id);
