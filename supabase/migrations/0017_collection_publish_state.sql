-- Batch 5: collections need a publish/unpublish state — the storefront
-- should only ever see published collections; staff can see and toggle all.

alter table collections add column is_published boolean not null default true;

drop policy if exists "Public can read collections" on collections;
create policy "Public can read published collections" on collections
  for select using (is_published or has_any_role('content_manager', 'admin', 'super_admin'));
