-- Batch 15: server-side "verified purchase" enforcement, a Hide moderation
-- state, and storage for review images.
--
-- Gap closed: the existing "Customers write own reviews" INSERT policy
-- (migration 0014) only checked `profile_id = auth.uid()` — nothing stopped
-- a client from inserting any `order_id` it liked, including someone
-- else's order or an order that never contained this product, and getting
-- an unearned "Verified Purchase" badge. A BEFORE INSERT trigger now
-- derives order_id server-side from the customer's own qualifying order
-- (or blocks the insert entirely if none exists) — the client can no
-- longer supply or influence it.

drop policy "Public can read approved reviews" on reviews;
drop policy "Public can read images of approved reviews" on review_images;

alter type review_status rename to review_status_old;
create type review_status as enum ('pending', 'approved', 'rejected', 'hidden');
alter table reviews alter column status drop default;
alter table reviews alter column status type review_status using (status::text::review_status);
alter table reviews alter column status set default 'pending';
drop type review_status_old;

create policy "Public can read approved reviews" on reviews
  for select using (status = 'approved');
create policy "Public can read images of approved reviews" on review_images
  for select using (exists (select 1 from reviews r where r.id = review_images.review_id and r.status = 'approved'));

create or replace function enforce_review_verified_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _order_id uuid;
begin
  select o.id into _order_id
  from orders o
  join order_items oi on oi.order_id = o.id
  where o.profile_id = new.profile_id
    and oi.product_id = new.product_id
    and o.status in ('paid', 'processing', 'ready_for_shipping', 'shipped', 'delivered', 'refunded', 'partially_refunded')
  order by o.placed_at desc
  limit 1;

  if _order_id is null then
    raise exception 'You can only review products you have purchased.';
  end if;

  new.order_id := _order_id;
  return new;
end;
$$;

create trigger reviews_enforce_verified_purchase
  before insert on reviews
  for each row execute function enforce_review_verified_purchase();

-- Review image uploads. Public read (approved-review images are storefront
-- content); any signed-in customer can upload their own — the review_images
-- *table* RLS (migration 0014) is what actually gates which rows/URLs are
-- ever attached to a review, so a permissive bucket-level write is fine,
-- mirroring the product-images bucket's public-read shape.
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;

create policy "Public can view review images" on storage.objects
  for select using (bucket_id = 'review-images');

create policy "Customers can upload review images" on storage.objects
  for insert with check (bucket_id = 'review-images' and auth.role() = 'authenticated');

create policy "Customers can delete own review images" on storage.objects
  for delete using (bucket_id = 'review-images' and auth.role() = 'authenticated' and owner = auth.uid());
