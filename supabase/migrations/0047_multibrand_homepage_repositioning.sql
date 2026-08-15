-- Multi-brand / Liberian-identity repositioning: update the existing
-- homepage hero and the "New Releases" banner in place (no new visual
-- clutter added), insert one new banner introducing the brand directory,
-- and add one FAQ entry addressing the store's multi-brand model directly
-- — using the exact honest answer the brief itself specifies, since no
-- other policy has been confirmed.

update homepage_sections set config = jsonb_set(
  jsonb_set(
    jsonb_set(config, '{slides,0,heading}', '"The Rare Edit"'),
    '{slides,0,subheading}', '"A curated world of fashion, culture and individuality — rooted in Liberia and built for everywhere."'
  ),
  '{slides,0,imageDesktop}', '"https://images.unsplash.com/photo-1783013959203-1176111307e7?w=2000&q=80&auto=format&fit=crop&h=1000"'
) where type = 'hero';
update homepage_sections set config = jsonb_set(config, '{slides,0,imageMobile}', '"https://images.unsplash.com/photo-1783013959203-1176111307e7?w=900&q=80&auto=format&fit=crop&h=1125"')
  where type = 'hero';
update homepage_sections set config = jsonb_set(config, '{slides,0,ctaLabel}', '"Shop The Edit"') where type = 'hero';

-- "New Releases" banner becomes the house-brand feature.
update homepage_sections set
  title = 'X-Rare Banner',
  config = jsonb_build_object(
    'heading', 'X-Rare',
    'ctaLabel', 'Shop X-Rare',
    'ctaHref', '/brands/x-rare',
    'image', 'https://images.unsplash.com/photo-1508216310976-c518daae0cdc?w=1400&q=80&auto=format&fit=crop&h=900'
  )
where type = 'banner' and config->>'heading' = 'New Releases';

-- New section introducing the brand directory — positioned right after the
-- category grid, before the deeper product carousels.
insert into homepage_sections (type, title, position, is_enabled, config)
values (
  'banner',
  'Brands We Curate Banner',
  6,
  true,
  jsonb_build_object(
    'heading', 'The Brands We Curate',
    'ctaLabel', 'Explore Brands',
    'ctaHref', '/brands',
    'image', 'https://images.unsplash.com/photo-1535530705774-695729778c55?w=1400&q=80&auto=format&fit=crop&h=900'
  )
);
update homepage_sections set position = position + 1 where type = 'product_carousel' and title = 'Accessories';
update homepage_sections set position = position + 1 where type = 'banner' and title = 'Tracksuits Banner';
update homepage_sections set position = position + 1 where type = 'product_carousel' and title = 'Featured Products';
update homepage_sections set position = position + 1 where type = 'editorial' and title = 'Brand Statement';
update homepage_sections set position = position + 1 where type = 'product_carousel' and title = 'Explore More';

insert into faqs (question, answer, category, slug, sort_order) values
  ('Are all products X-Rare products?', 'No. X-Rare is both a fashion brand and a curated fashion retailer. Products may be from X-Rare or from selected partner brands — each product page and product card always shows exactly which brand you''re buying from.', 'products_sizing', 'are-all-products-x-rare-products', 3);
