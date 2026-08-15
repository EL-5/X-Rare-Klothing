-- Visual merchandising pass: replace every random picsum.photos placeholder
-- (product images, homepage hero/banners) and every null category/collection
-- image with real, properly-licensed fashion photography (Unsplash License —
-- free for commercial use; see docs/image-sources.md for full attribution).
-- URLs mirror src/data/images.ts, the single source of truth for which
-- photo id is used where — keep the two in sync if either changes.

-- Categories: only the 3 top-level categories (Men, Women, Accessories)
-- render an image today (see CategoryGrid.tsx, which filters to
-- parent_id is null), so only those get a real photo. Subcategories keep
-- image = null until a UI surface actually displays them.
update categories set image = 'https://images.unsplash.com/photo-1644092000597-ff2320ffbb6d?w=800&q=80&auto=format&fit=crop&h=1000' where slug = 'men';
update categories set image = 'https://images.unsplash.com/photo-1533392151650-269f96231f65?w=800&q=80&auto=format&fit=crop&h=1000' where slug = 'women';
update categories set image = 'https://images.unsplash.com/photo-1680690653166-1618c3bcdf51?w=800&q=80&auto=format&fit=crop&h=1000' where slug = 'accessories';

-- Collections
update collections set image = 'https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=800&q=80&auto=format&fit=crop&h=1000' where slug = 'new-in';
update collections set image = 'https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?w=800&q=80&auto=format&fit=crop&h=1000' where slug = 'best-sellers';
update collections set image = 'https://images.unsplash.com/photo-1662532577856-e8ee8b138a8b?w=800&q=80&auto=format&fit=crop&h=1000' where slug = 'summer-sale';
update collections set image = 'https://images.unsplash.com/photo-1629511565591-a1d494ad6c58?w=800&q=80&auto=format&fit=crop&h=1000' where slug = 'featured';

-- Product images: replace the existing picsum placeholders in place (same
-- row, same position/alt_text), then add a real secondary image for every
-- product that only had one.
update product_images set url = 'https://images.unsplash.com/photo-1508216310976-c518daae0cdc?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000001' and position = 1;
update product_images set url = 'https://images.unsplash.com/photo-1542406775-ade58c52d2e4?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000001' and position = 2;

update product_images set url = 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000002' and position = 1;
insert into product_images (product_id, url, alt_text, position)
  values ('30000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?w=1200&q=80&auto=format&fit=crop&h=1500', 'Straight Leg Denim, back', 2);

update product_images set url = 'https://images.unsplash.com/photo-1614693348454-1e0710d21c60?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000003' and position = 1;
insert into product_images (product_id, url, alt_text, position)
  values ('30000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1555583743-991174c11425?w=1200&q=80&auto=format&fit=crop&h=1500', 'Coach Jacket, back', 2);

update product_images set url = 'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000004' and position = 1;
insert into product_images (product_id, url, alt_text, position)
  values ('30000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1685328403755-de1d57e12e63?w=1200&q=80&auto=format&fit=crop&h=1500', 'Embroidered Hoodie, back', 2);

update product_images set url = 'https://images.unsplash.com/photo-1762337676182-28feaa48e3d4?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000005' and position = 1;
insert into product_images (product_id, url, alt_text, position)
  values ('30000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=1200&q=80&auto=format&fit=crop&h=1500', 'Ribbed Tank Top, back', 2);

update product_images set url = 'https://images.unsplash.com/photo-1762337679957-0994eeb9001b?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000006' and position = 1;
insert into product_images (product_id, url, alt_text, position)
  values ('30000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1762337677950-dcd609ca8ffa?w=1200&q=80&auto=format&fit=crop&h=1500', 'Pleated Midi Skirt, back', 2);

update product_images set url = 'https://images.unsplash.com/photo-1624687943971-e86af76d57de?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000007' and position = 1;
insert into product_images (product_id, url, alt_text, position)
  values ('30000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1732963947955-858ad7d5e540?w=1200&q=80&auto=format&fit=crop&h=1500', 'Canvas Tote Bag, detail', 2);

update product_images set url = 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=1200&q=80&auto=format&fit=crop&h=1500'
  where product_id = '30000000-0000-0000-0000-000000000008' and position = 1;
insert into product_images (product_id, url, alt_text, position)
  values ('30000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1510598969022-c4c6c5d05769?w=1200&q=80&auto=format&fit=crop&h=1500', 'Wool Blend Beanie, worn', 2);

-- Homepage hero slides (imageDesktop 2000x1000 cinematic crop, imageMobile
-- 900x1125 portrait crop — same source photo, different Unsplash CDN crop
-- params, per images.ts's unsplashUrl helper).
update homepage_sections set config = jsonb_set(
  jsonb_set(config, '{slides,0,imageDesktop}', '"https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=2000&q=80&auto=format&fit=crop&h=1000"'),
  '{slides,0,imageMobile}', '"https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=900&q=80&auto=format&fit=crop&h=1125"'
) where type = 'hero';
update homepage_sections set config = jsonb_set(
  jsonb_set(config, '{slides,1,imageDesktop}', '"https://images.unsplash.com/photo-1543728069-a3f97c5a2f32?w=2000&q=80&auto=format&fit=crop&h=1000"'),
  '{slides,1,imageMobile}', '"https://images.unsplash.com/photo-1543728069-a3f97c5a2f32?w=900&q=80&auto=format&fit=crop&h=1125"'
) where type = 'hero';
update homepage_sections set config = jsonb_set(
  jsonb_set(config, '{slides,2,imageDesktop}', '"https://images.unsplash.com/photo-1657815929003-b97cc426cb3d?w=2000&q=80&auto=format&fit=crop&h=1000"'),
  '{slides,2,imageMobile}', '"https://images.unsplash.com/photo-1657815929003-b97cc426cb3d?w=900&q=80&auto=format&fit=crop&h=1125"'
) where type = 'hero';

-- Homepage promotional banners
update homepage_sections set config = jsonb_set(config, '{image}', '"https://images.unsplash.com/photo-1733322992706-1210ca79f4df?w=1400&q=80&auto=format&fit=crop&h=900"')
  where type = 'banner' and config->>'heading' = 'New Releases';
update homepage_sections set config = jsonb_set(config, '{image}', '"https://images.unsplash.com/photo-1635650804060-bb009bcb2ea5?w=1400&q=80&auto=format&fit=crop&h=900"')
  where type = 'banner' and config->>'heading' = 'Tracksuits';
