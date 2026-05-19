-- Sprint: Stripe Connect marketplace payments

-- ============================================================
-- 1. CONNECT FIELDS ON PROFILES
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS connect_onboarded BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 2. PAYMENT FIELDS ON BOOKINGS
-- ============================================================
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT;
-- payment_status values: 'awaiting_payment' | 'authorized' | 'captured' | 'cancelled'
