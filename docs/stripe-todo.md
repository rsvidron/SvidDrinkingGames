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

## Runbook: refunding a customer

Refunds are handled manually. The `charge.refunded` webhook is
intentionally not wired up — low volume, and we'd rather eyeball each one.

1. **Refund the payment** — Stripe Dashboard → Payments → find the row →
   `⋯` → Refund. Full refund unless you're doing something bespoke.

2. **Revoke access** — Supabase SQL editor:
   ```sql
   -- If you know the user's email:
   delete from public.grants
   where user_id = (select id from public.profiles where email = 'them@example.com');

   -- Or, more precisely, only the grant tied to the refunded payment.
   -- Grab `stripe_payment_id` from Stripe (starts with `pi_` or `cs_`):
   delete from public.grants
   where stripe_payment_id = 'pi_...';
   ```

3. **Confirm** — either query `public.grants` for that user (should return
   0 rows for stripe-sourced grants), or ask the user to refresh and verify
   they hit the paywall.

Chargebacks (Stripe dispute) work the same way — Stripe removes the funds
on their end, you remove the grant. Watch for `charge.dispute.created`
emails from Stripe.

## What's left

Follow-ups. None blocks shipping.

### Tax / receipts (polish)

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
