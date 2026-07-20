# Debug endpoints

Two GET routes on the Node server, gated behind a `DEBUG_TOKEN` env
var. If the env var is unset, they return 404 (so there's no
zero-config attack surface).

Set on Railway:
```
DEBUG_TOKEN = any-random-string-you-generate
```

Rotate it after debug sessions if a token was shared in chat or
committed anywhere.

## `GET /api/debug/diagnose`

Returns a health report as JSON.

### Auth

Provide the token as `?token=...` in the query string, or as an
`X-Debug-Token` header.

### Example

```
https://drinking.svidnet.com/api/debug/diagnose?token=YOUR_TOKEN
```

### Response shape

```json
{
  "env": {
    "STRIPE_SECRET_KEY":        { "present": true, "length": 107, "prefix": "sk_liv" },
    "STRIPE_WEBHOOK_SECRET":    { "present": true, "length": 38,  "prefix": "whsec_" },
    "STRIPE_PRICE_DAY_PASS":    { "present": true, "length": 30,  "prefix": "price_" },
    "STRIPE_PRICE_LIFETIME":    { "present": true, "length": 30,  "prefix": "price_" },
    "SUPABASE_URL":             { "present": true, "length": 47,  "prefix": "https:" },
    "SUPABASE_SERVICE_ROLE_KEY":{ "present": true, "length": 60,  "prefix": "sb_sec" }
  },
  "stripe": {
    "mode": "live",              // or "test"
    "account_id": "acct_...",
    "prices": {
      "day_pass":  { "id": "price_...", "active": true,  "unit_amount": 499,  "currency": "usd", "livemode": true },
      "lifetime":  { "error": "No such price: 'price_xxx'" }
    }
  },
  "supabase": { "reachable": true }
}
```

### Reading it

- `env.*.present === false` → the env var is missing or empty
- `env.*.prefix` → tells you if you pasted the wrong secret (e.g. `sk_test_` when you expected `sk_live_`)
- `stripe.mode` → derived from the secret key prefix. Should match your product / webhook mode.
- `stripe.prices.day_pass.livemode` — should match `stripe.mode`. If secret key is live but price is `livemode: false`, they're from different modes.
- `stripe.prices.*.error` — Stripe returns "No such price: 'price_xxx'" when the ID doesn't exist in the current mode.
- `supabase.reachable === false` → service_role key wrong, URL wrong, or Supabase project paused/down.

## `GET /api/debug/logs?tail=N`

Returns the last N lines from an in-memory rolling buffer. N defaults
to 200, capped at 500.

`console.log`, `console.warn`, and `console.error` are wrapped at
server startup to also push to the buffer, so anything the server has
logged since it started is retrievable — no shell access to Railway
needed.

### Example

```
curl -s "https://drinking.svidnet.com/api/debug/logs?token=YOUR_TOKEN&tail=100"
```

Response is `text/plain`, one line per entry, most recent last.

### Useful line prefixes

- `[stripe]` — Stripe SDK errors on checkout create, webhook errors
- `[server]` — general server messages
- Anything with an `Error:` — an exception surfaced

## Disabling

Just delete the `DEBUG_TOKEN` env var and redeploy. Both routes 404.
</content>
