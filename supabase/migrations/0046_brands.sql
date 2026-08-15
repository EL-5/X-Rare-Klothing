-- Multi-brand transformation: X-Rare repositions from a single-brand store
-- to a curated multi-brand fashion destination. `products.brand` (free
-- text, added early on and always just "X-Rare" for every seeded product)
-- becomes a real relational `brands` table with its own storefront pages,
-- admin management, and a `products.brand_id` FK — the exact scaffolding
-- section 18/19/20 of the brief asks for.
--
-- Only one real brand exists to seed here: X-Rare itself. No third-party
-- brand has been authorized/configured, so per the brief's own "do not
-- invent brands" instruction, nothing else is added — the architecture
-- is built to onboard real brands through the new admin page whenever
-- that data exists, not faked with placeholder Nike/Adidas rows.

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo text,
  cover_image text,
  description text,
  country text,
  website text,
  is_published boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brands_published_idx on brands (is_published);

create trigger brands_set_updated_at
  before update on brands
  for each row execute function set_updated_at();

alter table brands enable row level security;

create policy "Public can read published brands" on brands
  for select using (is_published or has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff manage brands" on brands
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update brands" on brands
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete brands" on brands
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

create trigger audit_brands
  after insert or update or delete on brands
  for each row execute function log_audit_event();

-- Seed the one real brand and migrate every existing product onto it.
insert into brands (name, slug, description, country, is_published, is_featured)
values (
  'X-Rare',
  'x-rare',
  'X-Rare''s own line — rare by design, different by nature. Designed and produced by X-Rare, not resold from anywhere else.',
  'Liberia',
  true,
  true
);

alter table products add column brand_id uuid references brands (id) on delete set null;
update products set brand_id = (select id from brands where slug = 'x-rare');
create index products_brand_id_idx on products (brand_id);

-- The free-text column is now redundant — every read path moves to the
-- relational brand_id (see productRepository.ts) in this same batch.
alter table products drop column brand;
