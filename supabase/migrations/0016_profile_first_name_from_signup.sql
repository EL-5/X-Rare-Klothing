-- Registration (Batch 3) passes `first_name`/`accepts_marketing` via
-- Supabase Auth's signUp `options.data`, which lands in
-- `auth.users.raw_user_meta_data` — not something `handle_new_user()`
-- previously read. Update the trigger function so the profile is fully
-- populated the moment the auth user is created, regardless of whether
-- email confirmation delays session creation.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, accepts_marketing)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    coalesce((new.raw_user_meta_data ->> 'accepts_marketing')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
