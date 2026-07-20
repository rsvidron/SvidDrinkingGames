# Deployment

## Hosting

- **Railway** — single Node service that:
  - Runs `npm run build` at build time (Vite compiles to `dist/`)
  - Runs `npm run start` at deploy time → `node scripts/server.mjs`
  - Serves static files, WebSocket, API, and webhooks all on the
    same port
- **Custom domain**: drinking.svidnet.com → CNAME to the Railway URL

Railway auto-deploys on push to `main`.

## Node version

Pinned in `nixpacks.toml` because Vite 8's rolldown requires Node ≥
20.19 (`node:util`'s `styleText` export). Nixpacks defaults to Node 18
which would break the build.

```toml
[phases.setup]
nixPkgs = ["nodejs_22"]
```

Also pinned via `engines.node` in `package.json`.

## Environment variables

All set on Railway → the service → Variables tab.

### Frontend (baked into Vite bundle at BUILD time)

These are compiled into the JS bundle when `npm run build` runs.
Changing them requires a rebuild — a plain restart won't pick them up.

```
VITE_SUPABASE_URL           = https://mzmtialeyghewpvwfoxt.supabase.co
VITE_SUPABASE_ANON_KEY      = sb_publishable_...
```

### Server (read at runtime)

```
SUPABASE_SERVICE_ROLE_KEY   = sb_secret_...
STRIPE_SECRET_KEY           = sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET       = whsec_...
STRIPE_PRICE_DAY_PASS       = price_...
STRIPE_PRICE_LIFETIME       = price_...
```

Optional:
```
SUPABASE_URL                = same value as VITE_SUPABASE_URL
                              (server falls back to VITE_SUPABASE_URL if unset)
DEBUG_TOKEN                 = any random string; if unset, debug endpoints 404
```

### Verification

Once deployed, from a browser (or curl) with `DEBUG_TOKEN` set:

```
https://drinking.svidnet.com/api/debug/diagnose?token=YOUR_TOKEN
```

Returns JSON showing env-var presence, Stripe account_id + mode,
Stripe price fetches for both IDs, and Supabase reachability. See
[debug.md](./debug.md).

## Redeploying

- **Env var change**: Railway usually redeploys automatically. If not,
  Deployments tab → ⋮ → Redeploy.
- **Code change**: push to `main` → auto-deploy.
- **Force clean build**: bump a comment in `package.json`, commit,
  push. Or in Railway UI, use "Redeploy latest".

## Local dev

The dev flow uses:
- `npm run dev` → Vite dev server on port 5173 (frontend only, with
  HMR)
- Separately: `PORT=3001 node scripts/server.mjs` → the API + WS
  server on 3001

Vite's `server.proxy` config forwards `/ws`, `/api`, `/webhooks`
requests from 5173 → 3001 so the frontend can hit them as if
same-origin.

Local `.env.local` (gitignored) mirrors Railway env vars. See
`.env.example`.

## Domain email

Sending email requires:
- Resend domain verified (currently: `svidnet.com` verified)
- SPF, DKIM DNS records at your registrar / Cloudflare
- Supabase Auth → Emails → SMTP settings pointed at Resend

If email domain moves or sender needs to change, all three above have
to update.
</content>
