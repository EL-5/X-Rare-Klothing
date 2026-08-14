-- Batch 19 security audit: `0032_homepage_builder.sql` added a blanket
-- `"Public can read settings" for select using (true)` policy so the
-- announcement bar / footer tagline / support email could be read by
-- anonymous visitors. Postgres RLS policies OR together, so that policy
-- didn't scope down the original admin-only `0014` policy — it made the
-- *entire* `settings` table public-read, including any future admin-only
-- key (an API toggle, an internal flag) added without revisiting this.
-- Only 4 keys are actually meant to be public (confirmed by grepping every
-- public-facing settingsService.getAll() caller: Header.tsx, Footer.tsx,
-- Contact.tsx). Narrow the public policy to just those.

drop policy "Public can read settings" on settings;

create policy "Public can read specific public settings" on settings
  for select using (key in ('support_email', 'announcement_enabled', 'announcement_message', 'footer_tagline'));
