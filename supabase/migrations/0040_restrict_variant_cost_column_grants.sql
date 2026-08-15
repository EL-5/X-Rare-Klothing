-- Batch 24 final review, continued again: 0039's column-level REVOKE had
-- no effect — confirmed live, a direct REST call to product_variants still
-- returned cost_cents/barcode after 0039 was applied. Postgres can't
-- partially narrow an existing table-wide SELECT grant with a column-level
-- REVOKE; the original grant (from Supabase's own project provisioning,
-- not this repo's migrations) was table-wide, so it has to be revoked
-- table-wide and re-granted at the column level to actually restrict it.
--
-- This is safe now (and would NOT have been safe before this migration)
-- because every internal read path that legitimately needs the real
-- cost_cents/barcode value — cart building, product duplication, and the
-- create/update-variant "read back what I just wrote" pattern — was moved
-- in this same batch to read through `product_variants_readable` instead
-- of the base table directly (see productRepository.ts, cartRepository.ts).
-- That view is SECURITY INVOKER and computes the real value only when
-- has_any_role() is true, which is the one place able to tell a staff
-- reader apart from a customer even though both connect as the same
-- `authenticated` Postgres role.

revoke select on product_variants from anon, authenticated;
grant select (
  id, product_id, sku, price_cents, compare_at_price_cents, size, color,
  material, weight_grams, is_active, position, created_at, updated_at
) on product_variants to anon, authenticated;
