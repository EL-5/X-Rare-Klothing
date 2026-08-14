-- Store settings (key/value) and the audit log.

create table settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create trigger settings_set_updated_at
  before update on settings
  for each row execute function set_updated_at();

-- ============================================================
-- Audit log — append-only record of administrative actions.
-- Populated automatically by the generic trigger below (attached to
-- specific sensitive tables in 0013_audit_triggers.sql) and, where an
-- action isn't a plain row mutation (e.g. "exported customer list"),
-- written to directly by application code via the service role.
-- ============================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index audit_logs_actor_id_idx on audit_logs (actor_id);
create index audit_logs_created_at_idx on audit_logs (created_at desc);

create or replace function log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_id uuid;
begin
  if tg_op = 'DELETE' then
    entity_id := (to_jsonb(old) ->> 'id')::uuid;
  else
    entity_id := (to_jsonb(new) ->> 'id')::uuid;
  end if;

  insert into audit_logs (actor_id, action, entity_type, entity_id, before, after)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    entity_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;
