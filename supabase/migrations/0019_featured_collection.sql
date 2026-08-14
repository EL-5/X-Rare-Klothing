-- "Featured Products" collection — gives the homepage's FeaturedProducts rail
-- a real, admin-curatable data source (same collection/collection_products
-- infrastructure and admin UI built in Batch 5) instead of a hardcoded list.

insert into collections (id, slug, title, description, position, is_published)
values ('20000000-0000-0000-0000-000000000004', 'featured', 'Featured Products', 'Hand-picked pieces from the collection.', 4, true)
on conflict (id) do nothing;

insert into collection_products (collection_id, product_id, position)
select '20000000-0000-0000-0000-000000000004', id, row_number() over (order by created_at) - 1
from products
where id in (
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000007'
)
on conflict (collection_id, product_id) do nothing;
