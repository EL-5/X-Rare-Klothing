-- Batch 5: Supabase Storage bucket for product images.
-- Public read (product photos are public-facing storefront assets);
-- writes restricted to content staff, mirroring the RLS pattern used
-- everywhere else in this schema (see docs/authorization.md).

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can view product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Content staff can upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Content staff can update product images" on storage.objects
  for update using (bucket_id = 'product-images' and has_any_role('content_manager', 'admin', 'super_admin'));

create policy "Content staff can delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and has_any_role('content_manager', 'admin', 'super_admin'));
