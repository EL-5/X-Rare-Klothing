-- Batch 16: lightweight homepage CMS. Every homepage section the storefront
-- currently renders was hardcoded in src/config/homepage.ts and a fixed
-- JSX sequence in Home.tsx — a content change meant editing code. This
-- table becomes the single source of truth: sections can be enabled/
-- disabled and reordered by position, and the storefront renders whatever
-- is configured, in order.
--
-- `config` stays a loosely-typed jsonb blob (shape depends on `type`) since
-- each section type's fields are genuinely different and none of them need
-- to be queried/filtered by Postgres — same tradeoff as discounts.applies_to.
--
-- 'featured_collection' isn't a distinct section type: on this storefront,
-- "featuring a collection" already means showing a product_carousel
-- sourced from that collection (source: 'collection'), curated via the
-- existing /admin/collections product-assignment UI — introducing a
-- second, visually-different "collection tile" section type wouldn't match
-- anything the storefront does today, so it's left out per "keep the
-- system intentionally simple."

create type homepage_section_type as enum (
  'hero', 'product_carousel', 'banner', 'editorial', 'category_grid', 'newsletter'
);

create table homepage_sections (
  id uuid primary key default gen_random_uuid(),
  type homepage_section_type not null,
  title text not null,
  is_enabled boolean not null default true,
  position integer not null default 0,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index homepage_sections_position_idx on homepage_sections (position);

create trigger homepage_sections_set_updated_at
  before update on homepage_sections
  for each row execute function set_updated_at();

alter table homepage_sections enable row level security;

create policy "Public can read enabled homepage_sections" on homepage_sections
  for select using (is_enabled or has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff manage homepage_sections" on homepage_sections
  for insert with check (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff update homepage_sections" on homepage_sections
  for update using (has_any_role('content_manager', 'admin', 'super_admin'));
create policy "Content staff delete homepage_sections" on homepage_sections
  for delete using (has_any_role('content_manager', 'admin', 'super_admin'));

-- `settings` was admin-only-read (migration 0014) — fine while every reader
-- was an admin page, but src/pages/Contact.tsx already reads support_email
-- from it for anonymous/customer visitors, and the new announcement/footer
-- content below needs the same. Nothing currently in `settings` is
-- sensitive, so a blanket public read is the simplest correct fix.
create policy "Public can read settings" on settings
  for select using (true);

insert into homepage_sections (type, title, position, config) values
  ('hero', 'Hero', 1, '{
    "slides": [
      {"id": "new-season", "eyebrow": "New Season", "heading": "Rare By Design", "subheading": "Different by nature — restrained silhouettes, heavyweight fabrics, made to last.", "ctaLabel": "Shop New In", "ctaHref": "/collections/new-in", "imageDesktop": "https://picsum.photos/seed/hf-hero-1-desktop/2000/1000", "imageMobile": "https://picsum.photos/seed/hf-hero-1-mobile/900/1125"},
      {"id": "best-sellers", "eyebrow": "Fan Favorites", "heading": "The Best Sellers", "subheading": "The pieces our customers keep coming back for.", "ctaLabel": "Shop Best Sellers", "ctaHref": "/collections/best-sellers", "imageDesktop": "https://picsum.photos/seed/hf-hero-2-desktop/2000/1000", "imageMobile": "https://picsum.photos/seed/hf-hero-2-mobile/900/1125"},
      {"id": "summer-sale", "eyebrow": "Limited Time", "heading": "Up To 50% Off", "subheading": "Select styles, while supplies last.", "ctaLabel": "Shop The Sale", "ctaHref": "/collections/summer-sale", "imageDesktop": "https://picsum.photos/seed/hf-hero-3-desktop/2000/1000", "imageMobile": "https://picsum.photos/seed/hf-hero-3-mobile/900/1125"}
    ]
  }'::jsonb),
  ('product_carousel', 'Best Sellers', 2, '{"heading": "Best Sellers", "viewAllHref": "/collections/best-sellers", "source": "collection", "collectionSlug": "best-sellers"}'::jsonb),
  ('banner', 'New Releases Banner', 3, '{"heading": "New Releases", "ctaLabel": "Explore Now", "ctaHref": "/collections/new-in", "image": "https://picsum.photos/seed/hf-promo-releases/1400/900"}'::jsonb),
  ('product_carousel', 'New In', 4, '{"heading": "New In", "viewAllHref": "/collections/new-in", "source": "collection", "collectionSlug": "new-in"}'::jsonb),
  ('category_grid', 'Shop By Category', 5, '{}'::jsonb),
  ('product_carousel', 'Accessories', 6, '{"heading": "Accessories", "viewAllHref": "/category/accessories", "source": "category", "categorySlug": "accessories"}'::jsonb),
  ('banner', 'Tracksuits Banner', 7, '{"heading": "Tracksuits", "ctaLabel": "Explore Now", "ctaHref": "/shop", "image": "https://picsum.photos/seed/hf-promo-tracksuits/1400/900"}'::jsonb),
  ('product_carousel', 'Featured Products', 8, '{"heading": "More Featured Products", "viewAllHref": "/collections/featured", "source": "collection", "collectionSlug": "featured"}'::jsonb),
  ('editorial', 'Brand Statement', 9, '{"label": "Our Story", "repeatedText": "X-RARE", "body": "Built for the person who does not want to look, think, or move like everybody else. Every collection represents identity, confidence, and individuality."}'::jsonb),
  ('product_carousel', 'Explore More', 10, '{"heading": "Explore More", "viewAllHref": "/shop", "source": "newest"}'::jsonb);
