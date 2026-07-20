# Authentication

Backed by **Supabase Auth** (GoTrue). The frontend uses the JS SDK
directly; our Node server verifies incoming JWTs when needed
(`/api/checkout/create`).

## Providers enabled

- **Email + password** — with email verification via Resend SMTP
- **Google OAuth** — no email verification needed (Google emails are
  already verified upstream)

## Signup flow (email)

1. `/signup` collects email, password, **birth year** (must be 21+
   at time of use), and a Terms/Privacy consent checkbox.
2. Birth year + agreed_to_terms timestamp are stashed in
   `sessionStorage` under `pending_profile`.
3. `supabase.auth.signUp({ email, password })` fires. The
   `on_auth_user_created` trigger in Postgres inserts a matching row
   into `public.profiles`.
4. Supabase sends the verification email via Resend.
5. User clicks the link → lands at `/auth/callback` with a valid
   session.
6. `AuthCallback.tsx` reads `pending_profile`, updates
   `public.profiles` with birth_year + agreed_to_terms_at, and
   navigates to `/`.

Why the sessionStorage handoff? RLS on `profiles.update` requires
`auth.uid() = id`. During signup the row is created but the session
isn't live yet (email verification pending), so a direct update would
be blocked. Deferring to AuthCallback lets us run the update when
authenticated.

## Signup flow (Google)

Same shape — Signup collects birth_year + consent, stashes them in
`pending_profile`, then calls `supabase.auth.signInWithOAuth`. After
the Google round-trip, AuthCallback finishes the profile.

## Login

- Email + password → `supabase.auth.signInWithPassword`
- Google → same OAuth path as signup

## Session

Persisted in localStorage by the Supabase SDK. `AuthProvider`
subscribes to `onAuthStateChange` and re-fetches the profile row on
any change.

## Password reset

`/reset-password` → email link → back at `/auth/callback` (Supabase
sets a temporary recovery session) → we surface a set-new-password
UI (not built yet — currently Supabase's default hosted flow works
via the emailed link).

## Route protection

`AuthGuard` component wraps game routes. Two states:

1. Not signed in → redirect to `/login`
2. Signed in but no access → `Paywall`

`/` is public — the Home component decides between Splash / Paywall /
game picker internally based on auth + access state.

Public routes (never gated):
- `/login`, `/signup`, `/reset-password`, `/auth/callback`
- `/terms`, `/privacy`
- `/checkout/success`, `/checkout/cancel`
- `/view/:code` — the FTD viewer is intentionally public so anyone
  with the QR / code can watch, no account needed

## Making yourself admin

Once you sign up, in Supabase SQL Editor:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

Admins bypass the paywall unconditionally and (once Phase 5 ships)
will see the "Admin portal" link in the Home hamburger menu.

## Env vars

- **Frontend** (baked into bundle at build time):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Server** (runtime):
  - `SUPABASE_URL` (or falls back to `VITE_SUPABASE_URL`)
  - `SUPABASE_SERVICE_ROLE_KEY` (for admin inserts / writes)

## Supabase dashboard config

- **Authentication → URL Configuration**
  - Site URL: `https://drinking.svidnet.com`
  - Redirect URLs: `https://drinking.svidnet.com/**` and
    `http://localhost:5173/**` (for local dev)
- **Authentication → Providers → Google**: Client ID + Client Secret
  from Google Cloud Console
- **Authentication → Emails → SMTP Settings**: Resend
  - Host: `smtp.resend.com`
  - Port: 465
  - Username: `resend`
  - Password: Resend API key
  - Sender email: an address at a Resend-verified domain (e.g.
    `noreply@svidnet.com`)
</content>
