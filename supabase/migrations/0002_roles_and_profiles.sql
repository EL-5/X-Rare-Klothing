-- Admin RBAC (roles + permissions) and customer profiles/addresses.
--
-- Design: `profiles.id` is the SAME uuid as `auth.users.id` (not a separate
-- surrogate key). This keeps every RLS predicate a simple `= auth.uid()`
-- instead of requiring a join through a customers table, and a profile row
-- is auto-created for every new auth user via the trigger at the bottom.

-- ============================================================
-- Admin roles / permissions
-- ============================================================

create table permissions (
  key text primary key,
  description text not null
);

create table role_permissions (
  role admin_role not null,
  permission_key text not null references permissions (key) on delete cascade,
  primary key (role, permission_key)
);

-- A user can hold more than one admin role (e.g. order_manager + customer_support).
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role admin_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index user_roles_user_id_idx on user_roles (user_id);

-- ============================================================
-- RBAC helper functions — used throughout RLS policies (0014_rls_policies.sql)
-- and by application code via RPC where convenient.
-- ============================================================

create or replace function has_role(_role admin_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles where user_id = auth.uid() and role = _role
  );
$$;

create or replace function has_any_role(variadic _roles admin_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles where user_id = auth.uid() and role = any(_roles)
  );
$$;

-- Any admin role at all — used for "staff can at least read this" checks.
create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from user_roles where user_id = auth.uid());
$$;

create or replace function has_permission(_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role = ur.role
    where ur.user_id = auth.uid()
      and rp.permission_key = _permission_key
  );
$$;

-- ============================================================
-- Profiles
-- ============================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null,
  first_name text,
  last_name text,
  phone text,
  accepts_marketing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-provision a profile row whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Addresses
-- ============================================================

create table addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  type address_type not null default 'shipping',
  is_default boolean not null default false,
  first_name text not null,
  last_name text not null,
  company text,
  address1 text not null,
  address2 text,
  city text not null,
  region text,
  postal_code text,
  country_code text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_profile_id_idx on addresses (profile_id);

create trigger addresses_set_updated_at
  before update on addresses
  for each row execute function set_updated_at();

-- Only one default address per (profile, type).
create unique index addresses_one_default_per_type
  on addresses (profile_id, type)
  where is_default;
