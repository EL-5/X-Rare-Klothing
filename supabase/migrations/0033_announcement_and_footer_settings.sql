-- Seed default settings for the new announcement bar / footer tagline
-- content controls (Batch 16) — preserves the previous hardcoded defaults
-- ("Free shipping on orders over $200" / the X-Rare tagline) as the
-- starting values an admin can now edit from /admin/settings.
insert into settings (key, value) values
  ('announcement_enabled', '{"value": true}'::jsonb),
  ('announcement_message', '{"value": "Free shipping on orders over $200"}'::jsonb),
  ('footer_tagline', '{"value": "Rare by design. Different by nature."}'::jsonb)
on conflict (key) do nothing;
