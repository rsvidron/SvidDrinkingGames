# Stripe — status & remaining work

## Status: ✅ Phase 3 verified end-to-end (2026-07-23)

Real live-mode payments succeed for both plans:

- Day Pass ($4.99) → `grants` row with `expires_at ≈ now + 24h`, `source = 'stripe'`
- Lifetime ($20) → `grants` row with `expires_at IS NULL`, `source = 'stripe'`
- `checkout.session.completed` webhook fires, signature verifies, grant lands within ~1s
- Frontend `/checkout/success` poll picks up the grant within ~2-4s and auto-navigates to the picker

### What tripped us up

The env vars `STRIPE_PRICE_DAY_PASS` / `STRIPE_PRICE_LIFETIME` were originally
set to Stripe **product** IDs (`prod_…`) instead of **price** IDs (`price_…`).
`stripe.checkout.sessions.create` failed with `No such price: 'prod_…'`, which
the code masked as the generic `stripe_error` label.

`/api/debug/diagnose` spotted this in one hit — retrieving the "price" via
`stripe.prices.retrieve(id)` returned an error with the offending prefix
visible. If a Stripe issue ever recurs, that endpoint is the first move (see
below).

## Debug tooling

Two endpoints in [`scripts/server.mjs`](../scripts/server.mjs) are gated
behind the `DEBUG_TOKEN` env var — they 404 when the token isn't set.

- `GET /api/debug/diagnose?token=…` — env-var presence + first 6 chars,
  Stripe account id + inferred mode, both price IDs looked up via real
  Stripe API calls, Supabase reachability
- `GET /api/debug/logs?token=…&tail=N` — last N lines of the in-memory
  ring buffer (default 200, max 500)

Leave `DEBUG_TOKEN` unset in normal operation.

## What's left

Ordered by priority. Nothing here blocks shipping — the current flow works —
but these are the follow-ups.

### 1. Refund / chargeback revocation (revenue-leak risk)

The webhook only handles `checkout.session.completed`. If we refund a
purchase (or the customer disputes it), the `grants` row stays active — the
user keeps their access even though we gave the money back.

Fix: subscribe to `charge.refunded` and `charge.dispute.created` in the
Stripe webhook config, look up the grant by `stripe_payment_id`, and delete
(or set `expires_at = now()`) so `useAccess` bounces them back to the
paywall. Right now we manually delete rows in Supabase after each refund.

### 2. Webhook idempotency (double-grant risk)

Stripe retries webhooks on 5xx / timeout. If our handler is slow and the
first response times out, Stripe delivers the same event again and we'd
insert a duplicate `grants` row.

Fix: add a unique index on `grants.stripe_payment_id`, then either
`on conflict do nothing` on insert or check-then-insert. Low-probability in
practice but cheap to add.

### 3. Reuse a single Stripe Customer per user (polish)

Right now every checkout passes `customer_email` and Stripe creates a fresh
Customer object each time — one user with three purchases shows up as three
separate Customers in the Stripe dashboard.

Fix: add `stripe_customer_id` to `public.profiles`, look up or create at
checkout time, pass `customer: customerId` to `sessions.create`.

### 4. Tax / receipts (polish)

- Stripe Tax isn't enabled — we're not calculating sales tax on the $20
  Lifetime. Check whether it matters for your state/scale before enabling.
- Receipt emails: default-on in Stripe settings; verify under
  Settings → Emails → "Successful payments".

## Code pointers

- Checkout create: [`scripts/server.mjs`](../scripts/server.mjs) → `handleCheckoutCreate`
- Webhook handler: same file → `handleStripeWebhook`
- Debug endpoints: same file → `handleDebugDiagnose` / `handleDebugLogs`
- Paywall button wiring: [`src/pages/Paywall.tsx`](../src/pages/Paywall.tsx) → `startCheckout`
- Success poll: [`src/pages/CheckoutSuccess.tsx`](../src/pages/CheckoutSuccess.tsx)
