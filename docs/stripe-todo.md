# Stripe checkout — outstanding issue

Phase 3 (Stripe payments) is **built but not verified end-to-end** yet.
Everything is wired up, we just hit an error on the first live-mode
test purchase and haven't diagnosed it.

## Current status

- ✅ Stripe products created (Day Pass $4.99, Lifetime $20)
- ✅ Webhook endpoint created in Stripe pointing at
  `https://drinking.svidnet.com/webhooks/stripe`
- ✅ Railway env vars set (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_DAY_PASS`, `STRIPE_PRICE_LIFETIME`,
  `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- ✅ Server code: `POST /api/checkout/create`,
  `POST /webhooks/stripe`, debug endpoints
- ✅ Frontend code: Paywall wired to `/api/checkout/create`, redirects
  to Stripe URL. `/checkout/success` polls access refresh. `/checkout/cancel`
- ❌ **Test purchase failed** with:
  - Client-side: 500 from `/api/checkout/create`
  - Server returned: `{ error: "stripe_error" }`

`stripe_error` means the Stripe SDK threw when we called
`stripe.checkout.sessions.create`. The actual exception is in the
server logs but we couldn't see them.

## Most likely root cause

**Test/live mode mismatch.** If any single one of these is in a different mode:
- `STRIPE_SECRET_KEY` (starts with `sk_live_` vs `sk_test_`)
- Both price IDs (created in live mode products vs test mode products)
- Webhook signing secret (live-mode webhook vs test-mode webhook)

...then Stripe returns "No such price" or "Invalid API Key".

Since the Stripe account is fully activated (live-mode enabled), and
the price IDs are from live-mode products, the secret key MUST be a
`sk_live_...` key. Verify.

## How to diagnose (do this to resume)

1. **Set `DEBUG_TOKEN` env var on Railway** (any random string), let it redeploy.

2. In a browser, hit:
   ```
   https://drinking.svidnet.com/api/debug/diagnose?token=YOUR_TOKEN
   ```

3. The JSON response tells you:
   - Every env var's presence + first 6 chars (so you can confirm `sk_live_...` vs `sk_test_...`)
   - Stripe account_id + inferred mode
   - Both price IDs — retrieved with real Stripe API calls. Shows `active`, `unit_amount`, `livemode`, or an error like `"No such price: 'price_xxx'"`.
   - Supabase reachability

   Diagnose result will spot the mismatch immediately.

4. Alternatively, hit:
   ```
   https://drinking.svidnet.com/api/debug/logs?token=YOUR_TOKEN&tail=100
   ```
   for raw server logs (last 100 lines). Look for `[stripe] checkout.session.create failed` with the underlying error message.

## Once mismatch is fixed

Retest the flow:

1. Log in as a user without an active grant (delete grants if needed)
2. Paywall → **Get 24-hour pass**
3. Should redirect to `checkout.stripe.com/...`
4. Live test: use a real card + Stripe dashboard refund after; or flip everything to Test mode + use `4242 4242 4242 4242` (any future exp, any CVC, any ZIP)
5. On success, redirected to `/checkout/success` → should activate within ~2-4s → auto-navigate to game picker
6. Verify server-side:
   ```sql
   select * from public.grants order by created_at desc limit 3;
   ```
7. Verify Stripe webhook delivered:
   Stripe Dashboard → Developers → Webhooks → your endpoint → Event log → look for `checkout.session.completed` with green 200 response

## Code pointers (if the fix needs code changes)

- Checkout create handler: [`scripts/server.mjs`](../scripts/server.mjs), `handleCheckoutCreate`
- Webhook handler: same file, `handleStripeWebhook`
- Frontend paywall button wiring: [`src/pages/Paywall.tsx`](../src/pages/Paywall.tsx), `startCheckout`
- Success poll: [`src/pages/CheckoutSuccess.tsx`](../src/pages/CheckoutSuccess.tsx)
- Debug endpoint: `scripts/server.mjs`, `handleDebugDiagnose` / `handleDebugLogs`

## After Stripe works

- Manually test both plans (day pass + lifetime)
- Verify day-pass grants expire at `now() + 24h` and get denied after
- Verify lifetime grants have `expires_at = null`
- Test the refund path once (Stripe → Payments → refund) — grants
  don't auto-revoke on refund yet; may want a webhook for
  `charge.refunded` to expire the grant. Punt to a future phase.
</content>
