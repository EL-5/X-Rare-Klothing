-- Batch 19 security audit: harden file upload validation.
--
-- Confirmed via live testing against review-images: an authenticated
-- customer could upload an HTML file with an embedded <script> tag
-- disguised with a .jpg extension, an SVG with an embedded <script> tag
-- under its real image/svg+xml content type, and an arbitrary-size blob —
-- none were rejected. Root causes:
--   1. Neither bucket had `allowed_mime_types`/`file_size_limit` set, so
--      the Storage API enforced nothing; the client's <input accept=...>
--      is a UI hint only and trivially bypassed with a raw request.
--   2. The review-images INSERT policy only checked `auth.role() =
--      'authenticated'`, not that the upload path's review actually
--      belongs to the uploader — any signed-in user could write into any
--      other review's folder.
--
-- Fix: constrain both buckets to raster image MIME types only (excluding
-- image/svg+xml, which can execute embedded <script> content when a
-- browser is navigated to the file directly) with a 5MB cap, and require
-- review-image uploads to land under a review the uploader actually owns
-- (matching the real path convention used by reviewRepository.uploadImage:
-- `${reviewId}/${uuid}-${filename}`).

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    file_size_limit = 5242880 -- 5MB
where id in ('product-images', 'review-images');

drop policy "Customers can upload review images" on storage.objects;

create policy "Customers can upload own review images" on storage.objects
  for insert with check (
    bucket_id = 'review-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from reviews
      where reviews.id::text = (storage.foldername(name))[1]
        and reviews.profile_id = auth.uid()
    )
  );
