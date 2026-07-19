-- Drinking Games — initial schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).

-- =====================================================================
-- Tables
-- =====================================================================

-- User profile extends auth.users. Row is auto-created via trigger below.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  birth_year int,
  agreed_to_terms_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Grants = an active entitlement to use the app.
create table public.grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('day_pass','lifetime','license_key','admin')),
  expires_at timestamptz,                                 -- null = never expires
  source text not null check (source in ('stripe','license_key','admin')),
  stripe_payment_id text,
  license_key_id uuid,
  created_at timestamptz not null default now()
);

create index grants_user_id_idx on public.grants(user_id);
create index grants_expires_at_idx on public.grants(expires_at) where expires_at is not null;

-- License keys — single-use codes admins hand out.
create table public.license_keys (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  grant_type text not null check (grant_type in ('day_pass','lifetime')),
  duration_hours int,                                    -- for day_pass
  redeemed_by_user_id uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz,
  created_by_admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index license_keys_code_idx on public.license_keys(code);

-- Singleton settings row (id = 1). Free weekend window + future site flags.
create table public.app_settings (
  id int primary key default 1,
  free_weekend_from timestamptz,
  free_weekend_to timestamptz,
  updated_at timestamptz not null default now(),
  constraint app_settings_single check (id = 1)
);
insert into public.app_settings (id) values (1);

-- =====================================================================
-- Auto-create a profile row when a Supabase auth user is created
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Access-check function: does user have access right now?
-- =====================================================================

create or replace function public.user_has_access(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Free weekend window is currently open?
    coalesce(
      (select true
         from public.app_settings
        where id = 1
          and free_weekend_from is not null
          and free_weekend_to   is not null
          and free_weekend_from <= now()
          and free_weekend_to   >= now()
        limit 1),
      false
    )
    or
    -- Any active grant?
    exists (
      select 1
        from public.grants
       where user_id = check_user_id
         and (expires_at is null or expires_at > now())
    );
$$;

-- =====================================================================
-- Row-Level Security
-- =====================================================================

alter table public.profiles      enable row level security;
alter table public.grants        enable row level security;
alter table public.license_keys  enable row level security;
alter table public.app_settings  enable row level security;

-- Helper: is the current caller an admin?
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- profiles: users see + update their own row; admins can see all.
create policy "profiles: read own or admin all"
  on public.profiles for select
  using (auth.uid() = id or public.current_user_is_admin());

create policy "profiles: users update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admins update any"
  on public.profiles for update
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- grants: users read their own; admins read/write anything.
create policy "grants: read own or admin"
  on public.grants for select
  using (auth.uid() = user_id or public.current_user_is_admin());

create policy "grants: admin full access"
  on public.grants for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- license_keys: admins-only. Redemption goes through a security-definer
-- function so users never touch this table directly.
create policy "license_keys: admin only"
  on public.license_keys for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- app_settings: anyone can read (needed to check free weekend); admins write.
create policy "settings: anyone read"
  on public.app_settings for select
  using (true);

create policy "settings: admin write"
  on public.app_settings for update
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- =====================================================================
-- License redemption RPC (users call this; single-use enforced).
-- =====================================================================

create or replace function public.redeem_license_key(code_input text)
returns table (grant_id uuid, grant_type text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  key_row public.license_keys;
  new_grant_id uuid;
  new_expires timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into key_row
    from public.license_keys
   where code = code_input
   for update;

  if not found then
    raise exception 'license key not found';
  end if;
  if key_row.redeemed_at is not null then
    raise exception 'license key already redeemed';
  end if;

  if key_row.grant_type = 'day_pass' then
    new_expires := now() + make_interval(hours => coalesce(key_row.duration_hours, 24));
  else
    new_expires := null;
  end if;

  insert into public.grants (user_id, type, expires_at, source, license_key_id)
       values (auth.uid(), key_row.grant_type, new_expires, 'license_key', key_row.id)
    returning id into new_grant_id;

  update public.license_keys
     set redeemed_by_user_id = auth.uid(),
         redeemed_at = now()
   where id = key_row.id;

  return query select new_grant_id, key_row.grant_type, new_expires;
end;
$$;

grant execute on function public.redeem_license_key(text) to authenticated;
grant execute on function public.user_has_access(uuid) to authenticated, anon;
