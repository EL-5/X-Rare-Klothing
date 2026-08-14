-- Development seed data: categories, collections, products, variants,
-- options, images, and opening inventory (via inventory_movements so the
-- trigger-maintained `inventory` snapshot stays consistent).
--
-- Run via `supabase db reset` (applies all migrations, then this file) for
-- a fresh local/dev database, or `psql <connection> -f supabase/seed/seed.sql`
-- against an already-migrated dev project.
--
-- Images are placeholder URLs (picsum.photos), not the reference site's
-- assets — swap for real, licensed product photography before going live.

-- ============================================================
-- Categories
-- ============================================================

insert into categories (id, parent_id, slug, name, description, position) values
  ('10000000-0000-0000-0000-000000000001', null, 'men', 'Men', 'Menswear.', 1),
  ('10000000-0000-0000-0000-000000000002', null, 'women', 'Women', 'Womenswear.', 2),
  ('10000000-0000-0000-0000-000000000003', null, 'accessories', 'Accessories', 'Bags, hats, and more.', 3);

insert into categories (id, parent_id, slug, name, description, position) values
  ('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'mens-shirts', 'Shirts', null, 1),
  ('10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'mens-denim', 'Denim', null, 2),
  ('10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'mens-jackets', 'Jackets', null, 3),
  ('10000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001', 'mens-hoodies', 'Hoodies', null, 4),
  ('10000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000002', 'womens-tops', 'Tops', null, 1),
  ('10000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000002', 'womens-skirts', 'Skirts', null, 2);

-- ============================================================
-- Collections
-- ============================================================

insert into collections (id, slug, title, description, position) values
  ('20000000-0000-0000-0000-000000000001', 'new-in', 'New In', 'The latest arrivals.', 1),
  ('20000000-0000-0000-0000-000000000002', 'best-sellers', 'Best Sellers', 'Our most-loved pieces.', 2),
  ('20000000-0000-0000-0000-000000000003', 'summer-sale', 'Summer Sale', 'Up to 50% off select styles.', 3);

-- ============================================================
-- Products
-- ============================================================

insert into products (id, slug, name, description, sku, status, brand, category_id, tags, seo_title, seo_description, published_at) values
  ('30000000-0000-0000-0000-000000000001', 'oversized-graphic-tee', 'Oversized Graphic Tee', 'A relaxed-fit tee in heavyweight cotton jersey with a front chest print.', 'HF-TEE-001', 'active', 'X-Rare', '10000000-0000-0000-0000-000000000011', array['tee','cotton','new-in'], 'Oversized Graphic Tee | X-Rare', 'Relaxed-fit heavyweight cotton tee with front chest print.', now()),
  ('30000000-0000-0000-0000-000000000002', 'straight-leg-denim', 'Straight Leg Denim', 'Rigid selvedge denim cut straight through the leg with a mid-rise waist.', 'HF-DNM-001', 'active', 'X-Rare', '10000000-0000-0000-0000-000000000012', array['denim','new-in'], 'Straight Leg Denim | X-Rare', 'Rigid selvedge denim, straight leg, mid-rise.', now()),
  ('30000000-0000-0000-0000-000000000003', 'coach-jacket', 'Coach Jacket', 'Lightweight shell jacket with snap closure and packable hood.', 'HF-JKT-001', 'active', 'X-Rare', '10000000-0000-0000-0000-000000000013', array['jacket','outerwear'], 'Coach Jacket | X-Rare', 'Lightweight shell jacket with packable hood.', now()),
  ('30000000-0000-0000-0000-000000000004', 'embroidered-hoodie', 'Embroidered Hoodie', 'Midweight fleece hoodie with tonal embroidered logo.', 'HF-HD-001', 'active', 'X-Rare', '10000000-0000-0000-0000-000000000014', array['hoodie','best-seller'], 'Embroidered Hoodie | X-Rare', 'Midweight fleece hoodie with tonal embroidered logo.', now()),
  ('30000000-0000-0000-0000-000000000005', 'ribbed-tank-top', 'Ribbed Tank Top', 'Fitted ribbed-knit tank in a stretch cotton blend.', 'HF-TNK-001', 'active', 'X-Rare', '10000000-0000-0000-0000-000000000021', array['top','new-in'], 'Ribbed Tank Top | X-Rare', 'Fitted ribbed-knit tank, stretch cotton blend.', now()),
  ('30000000-0000-0000-0000-000000000006', 'pleated-midi-skirt', 'Pleated Midi Skirt', 'Fluid pleated skirt that falls to mid-calf, finished with a satin waistband.', 'HF-SKT-001', 'active', 'X-Rare', '10000000-0000-0000-0000-000000000022', array['skirt','best-seller'], 'Pleated Midi Skirt | X-Rare', 'Fluid pleated midi skirt with satin waistband.', now()),
  ('30000000-0000-0000-0000-000000000007', 'canvas-tote-bag', 'Canvas Tote Bag', 'Heavy-duty canvas tote with interior pocket and reinforced handles.', 'HF-BAG-001', 'active', 'X-Rare', '10000000-0000-0000-0000-000000000003', array['bag','accessories'], 'Canvas Tote Bag | X-Rare', 'Heavy-duty canvas tote with reinforced handles.', now()),
  ('30000000-0000-0000-0000-000000000008', 'wool-blend-beanie', 'Wool Blend Beanie', 'Ribbed beanie in a soft wool blend with a folded cuff.', 'HF-CAP-001', 'active', 'X-Rare', '10000000-0000-0000-0000-000000000003', array['hat','accessories','new-in'], 'Wool Blend Beanie | X-Rare', 'Ribbed wool-blend beanie with folded cuff.', now());

-- ============================================================
-- Collection assignments
-- ============================================================

insert into collection_products (collection_id, product_id, position) values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 2),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 3),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000008', 4),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 1),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000006', 2),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 1),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007', 2);

-- ============================================================
-- Product options + option values (Color / Size per product, as applicable)
-- ============================================================

insert into product_options (id, product_id, name, position) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Color', 1),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Size', 2),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Size', 1),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'Color', 1),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'Size', 2),
  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', 'Color', 1),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000004', 'Size', 2),
  ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000005', 'Size', 1),
  ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000006', 'Size', 1),
  ('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000008', 'Color', 1);

insert into product_option_values (id, option_id, value, position) values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Black', 1),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'White', 2),
  ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'S', 1),
  ('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'M', 2),
  ('41000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'L', 3),
  ('41000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', '30', 1),
  ('41000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000003', '32', 2),
  ('41000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000003', '34', 3),
  ('41000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000004', 'Olive', 1),
  ('41000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000004', 'Black', 2),
  ('41000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000005', 'M', 1),
  ('41000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000005', 'L', 2),
  ('41000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000006', 'Black', 1),
  ('41000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000006', 'Grey', 2),
  ('41000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000007', 'S', 1),
  ('41000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000007', 'M', 2),
  ('41000000-0000-0000-0000-000000000017', '40000000-0000-0000-0000-000000000007', 'L', 3),
  ('41000000-0000-0000-0000-000000000018', '40000000-0000-0000-0000-000000000008', 'S', 1),
  ('41000000-0000-0000-0000-000000000019', '40000000-0000-0000-0000-000000000008', 'M', 2),
  ('41000000-0000-0000-0000-000000000024', '40000000-0000-0000-0000-000000000008', 'L', 3),
  ('41000000-0000-0000-0000-000000000020', '40000000-0000-0000-0000-000000000009', 'S', 1),
  ('41000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000009', 'M', 2),
  ('41000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000010', 'Black', 1),
  ('41000000-0000-0000-0000-000000000023', '40000000-0000-0000-0000-000000000010', 'Camel', 2);

-- ============================================================
-- Variants
-- ============================================================

insert into product_variants (id, product_id, sku, price_cents, compare_at_price_cents, cost_cents, size, color, material, weight_grams, position) values
  -- Oversized Graphic Tee: Black/White x S/M/L
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'HF-TEE-001-BLK-S', 4500, null, 1800, 'S', 'Black', 'Cotton', 220, 1),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'HF-TEE-001-BLK-M', 4500, null, 1800, 'M', 'Black', 'Cotton', 230, 2),
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'HF-TEE-001-BLK-L', 4500, null, 1800, 'L', 'Black', 'Cotton', 240, 3),
  ('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'HF-TEE-001-WHT-S', 4500, null, 1800, 'S', 'White', 'Cotton', 220, 4),
  ('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'HF-TEE-001-WHT-M', 4500, null, 1800, 'M', 'White', 'Cotton', 230, 5),
  ('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', 'HF-TEE-001-WHT-L', 4500, null, 1800, 'L', 'White', 'Cotton', 240, 6),

  -- Straight Leg Denim: 30/32/34
  ('50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', 'HF-DNM-001-30', 12000, 14000, 5200, '30', null, 'Denim', 680, 1),
  ('50000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000002', 'HF-DNM-001-32', 12000, 14000, 5200, '32', null, 'Denim', 700, 2),
  ('50000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000002', 'HF-DNM-001-34', 12000, 14000, 5200, '34', null, 'Denim', 720, 3),

  -- Coach Jacket: Olive/Black x S/M/L (abbreviated to one size per color for brevity)
  ('50000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000003', 'HF-JKT-001-OLV-M', 18900, 22900, 8000, 'M', 'Olive', 'Nylon', 540, 1),
  ('50000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000003', 'HF-JKT-001-BLK-M', 18900, 22900, 8000, 'M', 'Black', 'Nylon', 540, 2),

  -- Embroidered Hoodie: Black/Grey x M/L
  ('50000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000004', 'HF-HD-001-BLK-M', 9500, null, 4000, 'M', 'Black', 'Cotton Fleece', 620, 1),
  ('50000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000004', 'HF-HD-001-BLK-L', 9500, null, 4000, 'L', 'Black', 'Cotton Fleece', 640, 2),
  ('50000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000004', 'HF-HD-001-GRY-M', 9500, null, 4000, 'M', 'Grey', 'Cotton Fleece', 620, 3),
  ('50000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000004', 'HF-HD-001-GRY-L', 9500, null, 4000, 'L', 'Grey', 'Cotton Fleece', 640, 4),

  -- Ribbed Tank Top: S/M/L
  ('50000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000005', 'HF-TNK-001-S', 3200, null, 1200, 'S', null, 'Cotton Blend', 140, 1),
  ('50000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000005', 'HF-TNK-001-M', 3200, null, 1200, 'M', null, 'Cotton Blend', 150, 2),
  ('50000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000005', 'HF-TNK-001-L', 3200, null, 1200, 'L', null, 'Cotton Blend', 160, 3),

  -- Pleated Midi Skirt: S/M
  ('50000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000006', 'HF-SKT-001-S', 8900, 10900, 3600, 'S', null, 'Polyester', 320, 1),
  ('50000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000006', 'HF-SKT-001-M', 8900, 10900, 3600, 'M', null, 'Polyester', 330, 2),

  -- Canvas Tote Bag: single variant
  ('50000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000007', 'HF-BAG-001', 6500, null, 2600, null, null, 'Canvas', 450, 1),

  -- Wool Blend Beanie: Black/Camel
  ('50000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000008', 'HF-CAP-001-BLK', 2800, null, 900, null, 'Black', 'Wool Blend', 90, 1),
  ('50000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000008', 'HF-CAP-001-CML', 2800, null, 900, null, 'Camel', 'Wool Blend', 90, 2);

-- ============================================================
-- Variant <-> generic option value links (keeps product_variant_options in
-- sync with the size/color columns set above — see docs/database.md).
-- ============================================================

insert into product_variant_options (variant_id, option_value_id)
select v.id, ov.id
from product_variants v
join product_options po on po.product_id = v.product_id and po.name = 'Color'
join product_option_values ov on ov.option_id = po.id and ov.value = v.color
where v.color is not null
on conflict do nothing;

insert into product_variant_options (variant_id, option_value_id)
select v.id, ov.id
from product_variants v
join product_options po on po.product_id = v.product_id and po.name = 'Size'
join product_option_values ov on ov.option_id = po.id and ov.value = v.size
where v.size is not null
on conflict do nothing;

-- ============================================================
-- Product images (placeholder assets — replace before launch)
-- ============================================================

insert into product_images (product_id, variant_id, url, alt_text, position) values
  ('30000000-0000-0000-0000-000000000001', null, 'https://picsum.photos/seed/hf-tee-001-a/1200/1500', 'Oversized Graphic Tee, front', 1),
  ('30000000-0000-0000-0000-000000000001', null, 'https://picsum.photos/seed/hf-tee-001-b/1200/1500', 'Oversized Graphic Tee, back', 2),
  ('30000000-0000-0000-0000-000000000002', null, 'https://picsum.photos/seed/hf-dnm-001-a/1200/1500', 'Straight Leg Denim, front', 1),
  ('30000000-0000-0000-0000-000000000003', null, 'https://picsum.photos/seed/hf-jkt-001-a/1200/1500', 'Coach Jacket, front', 1),
  ('30000000-0000-0000-0000-000000000004', null, 'https://picsum.photos/seed/hf-hd-001-a/1200/1500', 'Embroidered Hoodie, front', 1),
  ('30000000-0000-0000-0000-000000000005', null, 'https://picsum.photos/seed/hf-tnk-001-a/1200/1500', 'Ribbed Tank Top, front', 1),
  ('30000000-0000-0000-0000-000000000006', null, 'https://picsum.photos/seed/hf-skt-001-a/1200/1500', 'Pleated Midi Skirt, front', 1),
  ('30000000-0000-0000-0000-000000000007', null, 'https://picsum.photos/seed/hf-bag-001-a/1200/1500', 'Canvas Tote Bag', 1),
  ('30000000-0000-0000-0000-000000000008', null, 'https://picsum.photos/seed/hf-cap-001-a/1200/1500', 'Wool Blend Beanie', 1);

-- ============================================================
-- Opening inventory — via inventory_movements so the `inventory` snapshot
-- (available/on_hand/reserved) is derived the same way it would be in
-- production, not hand-set.
-- ============================================================

insert into inventory_movements (variant_id, type, quantity, reason, reference_type)
select id, 'restock', 40, 'Initial stock load', 'seed'
from product_variants
where sku in (
  'HF-TEE-001-BLK-S', 'HF-TEE-001-BLK-M', 'HF-TEE-001-BLK-L',
  'HF-TEE-001-WHT-S', 'HF-TEE-001-WHT-M', 'HF-TEE-001-WHT-L',
  'HF-TNK-001-S', 'HF-TNK-001-M', 'HF-TNK-001-L'
);

insert into inventory_movements (variant_id, type, quantity, reason, reference_type)
select id, 'restock', 20, 'Initial stock load', 'seed'
from product_variants
where sku in (
  'HF-DNM-001-30', 'HF-DNM-001-32', 'HF-DNM-001-34',
  'HF-HD-001-BLK-M', 'HF-HD-001-BLK-L', 'HF-HD-001-GRY-M', 'HF-HD-001-GRY-L',
  'HF-SKT-001-S', 'HF-SKT-001-M'
);

insert into inventory_movements (variant_id, type, quantity, reason, reference_type)
select id, 'restock', 60, 'Initial stock load', 'seed'
from product_variants
where sku in ('HF-BAG-001', 'HF-CAP-001-BLK', 'HF-CAP-001-CML');

insert into inventory_movements (variant_id, type, quantity, reason, reference_type)
select id, 'restock', 12, 'Initial stock load (low-stock demo)', 'seed'
from product_variants
where sku in ('HF-JKT-001-OLV-M', 'HF-JKT-001-BLK-M');

-- Lower the low-stock threshold on one SKU so the "low stock" UI state has something to show.
update inventory
set low_stock_threshold = 15
where variant_id in (select id from product_variants where sku in ('HF-JKT-001-OLV-M', 'HF-JKT-001-BLK-M'));

-- ============================================================
-- Shipping + tax reference data
-- ============================================================

insert into shipping_zones (id, name, country_codes, cities, is_default) values
  ('65000000-0000-0000-0000-000000000001', 'Accra', array['GH'], array['Accra'], false),
  ('65000000-0000-0000-0000-000000000002', 'Tema', array['GH'], array['Tema'], false),
  ('65000000-0000-0000-0000-000000000003', 'Other Ghana', array['GH'], null, false),
  ('65000000-0000-0000-0000-000000000004', 'International', array[]::text[], null, true);

insert into shipping_methods (zone_id, name, price_cents, min_order_cents, min_delivery_days, max_delivery_days) values
  ('65000000-0000-0000-0000-000000000001', 'Accra Standard', 300, null, 2, 3),
  ('65000000-0000-0000-0000-000000000001', 'Accra Express', 500, null, 1, 2),
  ('65000000-0000-0000-0000-000000000002', 'Tema Standard', 400, null, 2, 4),
  ('65000000-0000-0000-0000-000000000003', 'Ghana Standard Delivery', 600, null, 3, 5),
  ('65000000-0000-0000-0000-000000000004', 'International Standard', 2500, null, 7, 14),
  ('65000000-0000-0000-0000-000000000004', 'International Express', 4500, null, 3, 5);

insert into tax_rates (country_code, region, rate, is_shipping_taxable) values
  ('US', 'CA', 0.0725, false),
  ('US', 'NY', 0.08, false),
  ('GH', null, 0, false);

-- ============================================================
-- Discounts
-- ============================================================

insert into discounts (id, name, kind, value, applies_to, is_active) values
  ('70000000-0000-0000-0000-000000000001', 'Welcome 10%', 'percentage', 10, '{"all": true}', true);

insert into discount_codes (discount_id, code) values
  ('70000000-0000-0000-0000-000000000001', 'WELCOME10');
