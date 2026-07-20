# Access Control

Whether a signed-in user can play games. Three sources of access, any
one is enough:

1. **`is_admin = true`** on the profile → admins bypass everything
2. **Free-weekend window is currently open** → grants access to all
   signed-in users, no purchase required
3. **An unexpired `grants` row** → day pass, lifetime, or license key

`useAccess()` merges all three into a single `hasAccess` boolean plus
metadata about the strongest grant.

## Free weekend

Controlled by the single `app_settings` row (id = 1).

Enable a window (SQL editor):

```sql
update public.app_settings
   set free_weekend_from = now(),
       free_weekend_to   = now() + interval '3 days',
       updated_at        = now()
 where id = 1;
```

Disable:

```sql
update public.app_settings
   set free_weekend_from = null,
       free_weekend_to   = null,
       updated_at        = now()
 where id = 1;
```

When active, a yellow banner ("🎉 FREE WEEKEND — full access until …")
shows across the game picker.

Users still have to sign up to play (age gate, terms consent), but
they don't need a paid grant or a license key.

## Grants table

Rows are created by:

- **Stripe webhook** on `checkout.session.completed`
  - source = `'stripe'`
  - stripe_payment_id populated
  - Day pass: `expires_at = now() + 24 hours`
  - Lifetime: `expires_at = null`
- **License key redemption** via `redeem_license_key(code)` RPC
  - source = `'license_key'`
  - license_key_id populated
- **Manual admin action** (currently SQL only; Phase 5 UI coming)
  - source = `'admin'`

`useAccess` picks the "best" active grant per priority:
`admin > lifetime > license_key > day_pass`. That's what's shown in
the future admin views for a user summary.

## License keys

Single-use, admin-issued codes.

### Generate (SQL)

```sql
insert into public.license_keys
       (code, grant_type, duration_hours, created_by_admin_id)
values ('BOBBY-LIFE-TEST-0001', 'lifetime', null,
        'e6c93a2e-bd12-4f3a-a3ed-6258d724de81');  -- your admin user id
```

For a day-pass key: `grant_type = 'day_pass'`, `duration_hours = 24`.

Codes are just strings. Convention we've been using:
`OWNER-KIND-NNNN-NNNN`. Anything unique works — the DB has a UNIQUE
constraint on `code`.

### Redeem

`Paywall.tsx` "Have a license key?" form → calls
`supabase.rpc('redeem_license_key', { code_input })` → the RPC
(security_definer, defined in the initial migration):

1. Verifies `auth.uid()` (must be signed in)
2. Selects the key row `for update`
3. Rejects if not found or already redeemed
4. Inserts a `grants` row with the right type / expiry
5. Marks the key redeemed (`redeemed_by_user_id`, `redeemed_at`)
6. Returns the new grant details

Single-use is enforced by step 3 combined with the `for update` lock —
two concurrent redemptions of the same code will race safely.

### Reset a redeemed key (dev only)

```sql
update public.license_keys
   set redeemed_by_user_id = null, redeemed_at = null
 where code = 'BOBBY-LIFE-TEST-0001';
-- also delete the grant it created if you want a totally fresh state:
delete from public.grants where license_key_id =
  (select id from public.license_keys where code = 'BOBBY-LIFE-TEST-0001');
```

## Refresh propagation

`useAccess` lives in an `AccessProvider` context at the top of
`App.tsx`. When Paywall redeems a key or the Stripe success page
completes, it calls `refresh()` from the context — every component
using `useAccess` (including Home) re-reads the new state and Paywall
automatically flips out of view.

Before we contextified this, `Paywall.tsx` and `Home.tsx` each had
their own `useState`-based useAccess and refresh only affected the
local copy. Home would stay stuck on Paywall until a page reload.
Context fixed it.
</content>
