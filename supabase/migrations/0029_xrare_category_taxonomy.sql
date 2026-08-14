-- X-Rare rebrand: align the category taxonomy with the brand brief's main
-- website categories (Men / Women / Accessories subcategories). Existing
-- categories that don't conflict (Denim, Skirts) are kept alongside the
-- brief's list rather than deleted, since real product fit outweighs strict
-- adherence to a marketing brief's illustrative list. "Shirts" is renamed to
-- "T-Shirts" since the one product in it is a tee. Accessories gains real
-- subcategories (it previously had none), so the two existing accessory
-- products move from the parent category to their matching leaf.

update categories set name = 'T-Shirts', slug = 'mens-tshirts' where id = '10000000-0000-0000-0000-000000000011';

insert into categories (id, parent_id, slug, name, position) values
  ('10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001', 'mens-pants', 'Pants', 4),
  ('10000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000001', 'mens-tracksuits', 'Tracksuits', 5),
  ('10000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000001', 'mens-outerwear', 'Outerwear', 6),
  ('10000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000002', 'womens-tshirts', 'T-Shirts', 2),
  ('10000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000002', 'womens-hoodies', 'Hoodies', 3),
  ('10000000-0000-0000-0000-000000000036', '10000000-0000-0000-0000-000000000002', 'womens-sets', 'Sets', 4),
  ('10000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000002', 'womens-jackets', 'Jackets', 5),
  ('10000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000002', 'womens-pants', 'Pants', 6),
  ('10000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000003', 'accessories-caps', 'Caps', 1),
  ('10000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000003', 'accessories-trucker-caps', 'Trucker Caps', 2),
  ('10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000003', 'accessories-bags', 'Bags', 3),
  ('10000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000003', 'accessories-beanies', 'Beanies', 4),
  ('10000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000003', 'accessories-socks', 'Socks', 5),
  ('10000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000003', 'accessories-lifestyle', 'Lifestyle Accessories', 6);

update products set category_id = '10000000-0000-0000-0000-000000000041' where id = '30000000-0000-0000-0000-000000000007'; -- Canvas Tote Bag -> Bags
update products set category_id = '10000000-0000-0000-0000-000000000042' where id = '30000000-0000-0000-0000-000000000008'; -- Wool Blend Beanie -> Beanies
