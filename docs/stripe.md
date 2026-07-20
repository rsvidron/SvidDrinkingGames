# Payments (Stripe)

Uses **Stripe Prebuilt Checkout** (hosted flow — user is redirected to
`checkout.stripe.com`, pays, and comes back).

## Products

Both are **one-time** charges. Set up in Stripe Dashboard → Products.

| Product | Price | Env var name (server) |
|---|---|---|
| Day Pass | $4.99 USD | `STRIPE_PRICE_DAY_PASS` |
| Lifetime | $20.00 USD | `STRIPE_PRICE_LIFETIME` |

Each product's **price ID** (starts with `price_...`) is what goes
into the env var — NOT the product ID (`prod_...`).

## Flow

```
User on paywall
    ↓  clicks "Get 24-hour pass" (or "Get lifetime access")
Frontend POST /api/checkout/create  { plan: "day_pass" | "lifetime" }
        Authorization: Bearer <supabase JWT>
    ↓
Server verifies JWT → creates Stripe Checkout Session
    ↓
Server returns { url }, frontend redirects window.location
    ↓
User pays on Stripe hosted page
    ↓
Stripe redirects to /checkout/success?session_id=cs_test_...
    ↓
Meanwhile Stripe POSTs to /webhooks/stripe
    ↓
Server verifies signature, on checkout.session.completed
inserts grants row via service_role
    ↓
Frontend /checkout/success polls useAccess.refresh() every
1.5s (up to 8 tries) — as soon as grants row exists, hasAccess
flips true, auto-navigate to Home.
```

## Server implementation

Both endpoints in [`scripts/server.mjs`](../scripts/server.mjs).

### POST /api/checkout/create

1. Requires `Authorization: Bearer <token>`; validates via
   `supabaseAdmin.auth.getUser(token)`.
2. Picks `priceId` based on `body.plan`.
3. Calls `stripe.checkout.sessions.create` with:
   - `mode: 'payment'`
   - `client_reference_id: user.id`
   - `customer_email: user.email`
   - `metadata: { user_id, plan }`  ← webhook reads these
   - `success_url: {origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url: {origin}/checkout/cancel`
4. Returns `{ url: session.url }` on success.

### POST /webhooks/stripe

1. Reads the raw request body (Stripe signature verification needs it
   byte-exact — must not JSON.parse first).
2. `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`
   — throws on signature mismatch.
3. On `checkout.session.completed`:
   - Reads `user_id`, `plan`, `payment_intent` from the session.
   - Inserts `grants { user_id, type, expires_at, source: 'stripe',
     stripe_payment_id }` via service_role client.
4. Always ack 200 back to Stripe if the signature was valid, so it
   doesn't retry.

## Webhook endpoint config in Stripe

Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://drinking.svidnet.com/webhooks/stripe`
- Events: `checkout.session.completed`
- Copy the **Signing secret** (starts with `whsec_`) into
  `STRIPE_WEBHOOK_SECRET`

## Env vars

Server needs all four:
```
STRIPE_SECRET_KEY=sk_live_xxx     (or sk_test_xxx)
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_DAY_PASS=price_xxx
STRIPE_PRICE_LIFETIME=price_xxx
```

## Test vs live mode

**Everything must match.** If any single thing is in a different
mode, Stripe returns "No such price" or "Invalid API Key".

- `sk_test_...` secret key ↔ test-mode products ↔ test-mode webhook secret
- `sk_live_...` secret key ↔ live-mode products ↔ live-mode webhook secret

Products created in test mode do NOT exist in live mode. You have to
either recreate them in live, or roll everything back to test until
you flip modes deliberately.

## Testing (test mode)

Test card:
- Number: `4242 4242 4242 4242`
- Exp: any future date
- CVC: any 3 digits
- ZIP: any 5 digits

Live-mode dry run:
- Buy your own product with a real card, then Stripe → Payments →
  the row → **Refund** to give yourself your money back. No fee
  refunds within 90 days.

## Debug the checkout endpoint

If `/api/checkout/create` returns 500 with `{ error: "stripe_error" }`,
the actual Stripe error is in the server logs. Fastest path: hit the
debug endpoints described in [debug.md](./debug.md) — the
`/api/debug/diagnose` endpoint tries `stripe.prices.retrieve` for both
price IDs and surfaces "No such price" mismatches inline.

## Common failure modes

| Symptom | Likely cause |
|---|---|
| `checkout_create` returns `{ error: "stripe_not_configured" }` | One of the 4 Stripe env vars is missing or `SUPABASE_SERVICE_ROLE_KEY` not set |
| `checkout_create` returns 500 `{ error: "stripe_error" }` | Stripe SDK threw — usually test/live mode mismatch; check debug/diagnose |
| Redirects to Stripe but page shows "Something went wrong" | Price is inactive or in a different mode than the secret key |
| Purchase completes, redirect to /checkout/success, but never activates | Webhook is failing — Stripe dashboard → Developers → Webhooks → your endpoint → Event log. Look for 400 (`bad_signature`) or 500 (`grant_insert_failed`) |
| Webhook says 200 but no grant appears | Metadata missing (unlikely) or RLS blocking service_role (shouldn't happen with service_role key). Check server logs. |
</content>
