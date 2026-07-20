# Database schema

Single migration: [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql).

## Tables

### `public.profiles`

Extends `auth.users`. One row per registered user, auto-created by
the `on_auth_user_created` trigger.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK, FK → auth.users) | matches auth user id |
| `email` | text | copied from auth.users on insert |
| `birth_year` | int, nullable | set by Signup form; enforced 21+ in UI |
| `agreed_to_terms_at` | timestamptz, nullable | set on signup consent |
| `is_admin` | bool | default false; admins bypass paywall |
| `created_at` | timestamptz | default now() |

### `public.grants`

An active entitlement to use the app. See
[access-control.md](./access-control.md).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | gen_random_uuid() |
| `user_id` | uuid (FK → profiles) | owner |
| `type` | text | `'day_pass' \| 'lifetime' \| 'license_key' \| 'admin'` |
| `expires_at` | timestamptz, nullable | null = never expires |
| `source` | text | `'stripe' \| 'license_key' \| 'admin'` |
| `stripe_payment_id` | text, nullable | from Stripe session |
| `license_key_id` | uuid, nullable | FK → license_keys.id |
| `created_at` | timestamptz | |

Indexes: `user_id`, `expires_at where not null`.

### `public.license_keys`

Single-use codes admins issue.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `code` | text UNIQUE | the redemption code string |
| `grant_type` | text | `'day_pass' \| 'lifetime'` — what redemption grants |
| `duration_hours` | int, nullable | for day_pass keys |
| `redeemed_by_user_id` | uuid, nullable | populated on redemption |
| `redeemed_at` | timestamptz, nullable | populated on redemption |
| `created_by_admin_id` | uuid | who issued the key |
| `created_at` | timestamptz | |

### `public.app_settings`

Singleton row (id = 1) with app-wide toggles.

| Column | Type | Notes |
|---|---|---|
| `id` | int (PK) | always 1; CHECK constraint enforces |
| `free_weekend_from` | timestamptz, nullable | start of free-weekend window |
| `free_weekend_to` | timestamptz, nullable | end |
| `updated_at` | timestamptz | |

## Functions

### `handle_new_user()`

Trigger function that inserts a `profiles` row on every `auth.users`
insert. `SECURITY DEFINER` so it runs as postgres (bypasses RLS).

### `user_has_access(check_user_id uuid) → bool`

Returns true if:

1. `app_settings` free-weekend window is currently open, OR
2. any un-expired `grants` row exists for the user

Frontend doesn't call this directly (does the same check
client-side in `useAccess`), but it's here for backend / policy use.

### `current_user_is_admin() → bool`

Convenience for RLS policies. Returns `is_admin` for `auth.uid()`.

### `redeem_license_key(code_input text) → table (grant_id, grant_type, expires_at)`

The redemption RPC. `SECURITY DEFINER` so it can UPDATE
`license_keys` (which is admin-only in RLS). See
[access-control.md](./access-control.md).

Granted to `authenticated` role only.

## Row-Level Security

RLS enabled on all four tables.

### profiles

- **Read**: own row OR admins
- **Update**: own row only (or admin can update any)

### grants

- **Read**: own rows OR admins
- **Write**: admins only (Stripe webhook uses service_role which
  bypasses RLS)

### license_keys

- **All ops**: admins only
- Users interact ONLY via `redeem_license_key` RPC

### app_settings

- **Read**: anyone (needed to check free-weekend window client-side)
- **Update**: admins only

## Making yourself admin

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

## Manually granting access (dev / support)

```sql
-- Lifetime for a user
insert into public.grants (user_id, type, source)
select id, 'lifetime', 'admin'
  from public.profiles
 where email = 'friend@example.com';
```

## Deleting a user cleanly

```sql
delete from auth.users where email = 'test@example.com';
-- cascades → profiles row deletes → grants delete via ON DELETE CASCADE
```
</content>
