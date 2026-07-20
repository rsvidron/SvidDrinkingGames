# Architecture

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript + Vite (built as SPA) |
| Client routing | react-router-dom v7 |
| Auth + DB | Supabase (Postgres + GoTrue) |
| Payments | Stripe (Prebuilt Checkout, one-time payments) |
| Email | Resend, plugged into Supabase as custom SMTP |
| Backend | Node 22 raw HTTP + `ws` — [scripts/server.mjs](../scripts/server.mjs) |
| Multi-device sync (Fuck the Dealer viewer) | WebSocket rooms, in-memory |
| Deploy | Railway (single service serves static bundle + WS + API) |
| Custom domain | drinking.svidnet.com |

Frontend and backend live in the same Railway service. Node serves the
built `dist/` folder plus handles `/ws`, `/api/*`, and `/webhooks/*`
routes.

## Repo layout

```
src/
  App.tsx                       Router + provider composition
  lib/
    supabase.ts                 Client singleton (VITE_SUPABASE_URL/ANON_KEY)
    authContext.tsx             AuthProvider + useAuth hook (session + profile)
    useAccess.tsx               AccessProvider + useAccess hook (grants, free weekend)
    sharedRoom.ts               useHostRoom / useViewerRoom (WS room hooks)
  components/
    AuthGuard.tsx               Route wrapper — enforces auth + access
    GameMenu.tsx / .css         Shared hamburger + rules/restart/back modal
    FreeWeekendBanner.tsx       Yellow banner shown while a free-weekend window is open
    PricingCards.tsx            Day-pass + lifetime cards used on splash + paywall
    PlayingCard.tsx             Card face component (SVG-free CSS-only design)
  pages/
    Splash.tsx                  Marketing landing for logged-out users
    Home.tsx                    Game picker (or Splash / Paywall depending on state)
    Paywall.tsx                 For logged-in users without access
    CheckoutSuccess.tsx         Post-Stripe redirect target; polls access
    CheckoutCancel.tsx          Post-Stripe cancel target
    auth/                       Login, Signup, ResetPassword, AuthCallback
    legal/                      Terms, Privacy
  games/
    registry.ts                 List of games shown on Home
    upDownRiver/                Up the River, Down the River (pyramid + river oval)
    kingsCup/                   Kings Cup (draw + rank rules)
    fuckTheDealer/              Fuck the Dealer (host + viewer + room sync)

scripts/
  server.mjs                    HTTP + WS + Stripe + Supabase admin + debug endpoints

supabase/
  migrations/0001_initial_schema.sql   The one and only DB migration (so far)

docs/                           This directory
```

## Request flow

### Static / SPA routes

Anything under `/` that isn't a known API path → server checks `dist/`
for a matching file, falls back to `dist/index.html` (client-side router
handles the URL).

### WebSocket

`/ws` — used by Fuck the Dealer's host and viewer to sync game state
in real time. Rooms are in-memory (`Map<code, Room>`). Server sends
ping frames every 25s to keep NAT/proxy timers happy. If the host
disconnects, the room is held for 60s so a reconnect + `reclaimRoom`
message can restore it with the original code and viewers stay put.

### API

- `POST /api/checkout/create` — verifies Supabase JWT (Bearer token),
  creates a Stripe Checkout Session, returns its URL for redirect.
- `POST /webhooks/stripe` — verifies Stripe signature, on
  `checkout.session.completed` inserts a `grants` row via
  service_role.
- `GET /api/debug/logs` — token-gated, in-memory log tail.
- `GET /api/debug/diagnose` — token-gated, environment + Stripe /
  Supabase reachability check.

## Provider composition (App.tsx)

```
AuthProvider
  AccessProvider           ← reads user + profile from AuthProvider
    BrowserRouter
      Routes
        ...
```

`AuthProvider` owns the Supabase session, refresh, and profile row.
`AccessProvider` combines the current user's grants, the free-weekend
window, and admin flag into a single `{ hasAccess, freeWeekend, ... }`
shape. Anywhere that needs to know either uses `useAuth()` or
`useAccess()`.
</content>
