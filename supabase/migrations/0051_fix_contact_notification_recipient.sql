-- Fix: notify_on_contact_submission() (0044) read settings.value directly
-- via `value #>> '{}'`, which stringifies the *entire* JSONB cell. Every
-- setting is written by settingsRepository.set() wrapped as `{ value: <x> }`
-- (see src/repositories/settingsRepository.ts's own docstring on why —
-- primitives need a real object shape to satisfy the jsonb Insert type),
-- so the trigger was enqueuing every contact-form notification addressed
-- to the literal string '{"value": ""}' instead of the configured support
-- email (or its fallback) — never a deliverable address, live-confirmed via
-- two real "sent" notifications with that exact garbage recipient.

create or replace function notify_on_contact_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _recipient citext;
begin
  select nullif(value ->> 'value', '')::citext into _recipient
  from settings where key = 'support_email';

  if _recipient is null then
    _recipient := 'support@x-rare.com';
  end if;

  perform enqueue_notification('contact_submission', _recipient, jsonb_build_object(
    'first_name', new.first_name,
    'last_name', new.last_name,
    'email', new.email,
    'subject', new.subject,
    'message', new.message
  ));
  return new;
end;
$$;

-- Repair the two notifications already enqueued with the garbage recipient
-- (both still 'sent' status — they were never actually deliverable, so this
-- only corrects the record; it doesn't re-trigger delivery).
update notifications
set recipient_email = 'support@x-rare.com'
where type = 'contact_submission' and recipient_email = '{"value": ""}';
