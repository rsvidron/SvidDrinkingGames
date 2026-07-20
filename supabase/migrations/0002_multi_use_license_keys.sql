-- 0002: multi-use license keys
-- Run in Supabase SQL editor after 0001 has been applied.

-- 1. Add multi-use columns to license_keys
alter table public.license_keys
  add column if not exists max_redemptions  int  not null default 1,
  add column if not exists redemption_count int  not null default 0;

-- 2. New audit table — one row per (key, user) redemption
create table if not exists public.license_key_redemptions (
  id             uuid primary key default gen_random_uuid(),
  license_key_id uuid not null references public.license_keys(id) on delete cascade,
  user_id        uuid not null references public.profiles(id)     on delete cascade,
  grant_id       uuid          references public.grants(id)       on delete set null,
  redeemed_at    timestamptz not null default now(),
  unique (license_key_id, user_id)   -- same user can't redeem twice
);

create index if not exists license_key_redemptions_key_idx
  on public.license_key_redemptions(license_key_id);
create index if not exists license_key_redemptions_user_idx
  on public.license_key_redemptions(user_id);

-- 3. Backfill any keys already redeemed under the old single-use schema.
--    (Safe to skip if the old columns are already gone.)
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'license_keys'
       and column_name  = 'redeemed_by_user_id'
  ) then
    insert into public.license_key_redemptions (license_key_id, user_id, redeemed_at)
    select id, redeemed_by_user_id, coalesce(redeemed_at, now())
      from public.license_keys
     where redeemed_by_user_id is not null
    on conflict do nothing;

    update public.license_keys
       set redemption_count = 1
     where redeemed_by_user_id is not null;
  end if;
end $$;

-- 4. Drop the legacy single-use columns
alter table public.license_keys
  drop column if exists redeemed_by_user_id,
  drop column if exists redeemed_at;

-- 5. RLS on the audit table
alter table public.license_key_redemptions enable row level security;

drop policy if exists "redemptions: admins read all" on public.license_key_redemptions;
create policy "redemptions: admins read all"
  on public.license_key_redemptions for select
  using (public.current_user_is_admin());

drop policy if exists "redemptions: users read own" on public.license_key_redemptions;
create policy "redemptions: users read own"
  on public.license_key_redemptions for select
  using (user_id = auth.uid());

-- The redeem RPC writes to this table via SECURITY DEFINER, so no INSERT
-- policy is needed for authenticated users.

-- 6. Rewrite the redemption RPC for multi-use + per-user uniqueness
create or replace function public.redeem_license_key(code_input text)
returns table (grant_id uuid, grant_type text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  key_row      public.license_keys;
  new_grant_id uuid;
  new_expires  timestamptz;
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

  if key_row.redemption_count >= key_row.max_redemptions then
    raise exception 'license key fully redeemed';
  end if;

  if exists (
    select 1 from public.license_key_redemptions
     where license_key_id = key_row.id
       and user_id        = auth.uid()
  ) then
    raise exception 'you already redeemed this key';
  end if;

  if key_row.grant_type = 'day_pass' then
    new_expires := now() + make_interval(hours => coalesce(key_row.duration_hours, 24));
  else
    new_expires := null;
  end if;

  insert into public.grants (user_id, type, expires_at, source, license_key_id)
       values (auth.uid(), key_row.grant_type, new_expires, 'license_key', key_row.id)
    returning id into new_grant_id;

  insert into public.license_key_redemptions (license_key_id, user_id, grant_id)
       values (key_row.id, auth.uid(), new_grant_id);

  update public.license_keys
     set redemption_count = redemption_count + 1
   where id = key_row.id;

  return query select new_grant_id, key_row.grant_type, new_expires;
end;
$$;

grant execute on function public.redeem_license_key(text) to authenticated;
