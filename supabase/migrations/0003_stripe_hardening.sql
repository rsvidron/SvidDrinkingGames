-- Stripe hardening: webhook idempotency + reusable Stripe Customer per user.
-- Run this in the Supabase SQL Editor.

-- ---------------------------------------------------------------------
-- 1. Webhook idempotency
--
-- Stripe retries webhooks if we respond slowly or with 5xx. A retry of the
-- same checkout.session.completed event would otherwise insert a second
-- `grants` row for the same purchase. A UNIQUE constraint on
-- stripe_payment_id makes the second insert a no-op (see server upsert).
--
-- NULLs are considered distinct by PostgreSQL, so non-Stripe grants
-- (license_key, admin — both have stripe_payment_id = null) are unaffected
-- by this constraint.
-- ---------------------------------------------------------------------
alter table public.grants
  add constraint grants_stripe_payment_id_key unique (stripe_payment_id);

-- ---------------------------------------------------------------------
-- 2. Reuse one Stripe Customer per user
--
-- Previously every checkout passed only `customer_email`, so Stripe minted
-- a fresh Customer object each time — cluttering the dashboard and making
-- refund/support workflows harder. Now the server looks up (or creates)
-- one Customer per user and stores its id here.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column stripe_customer_id text;

create index profiles_stripe_customer_id_idx
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;
