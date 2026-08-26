-- Record the actual money moved on each booking, as reported by Stripe.
--
-- Until now nothing about amounts was stored: revenue could only be guessed by
-- recomputing rides.price * PLATFORM_FEE_PERCENT. That is wrong the moment the
-- fee percentage changes or a driver edits a ride's price — historical earnings
-- would silently rewrite themselves. These columns are written once, from the
-- Stripe objects, and never recomputed.
--
-- Amounts are integer cents to match Stripe exactly and avoid float drift.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS amount_gross_cents integer,
  ADD COLUMN IF NOT EXISTS platform_fee_cents integer,
  ADD COLUMN IF NOT EXISTS amount_refunded_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'eur',
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

COMMENT ON COLUMN bookings.amount_gross_cents IS 'Total charged to the passenger, in cents, as captured by Stripe';
COMMENT ON COLUMN bookings.platform_fee_cents IS 'Platform commission (application_fee_amount) in cents, as reported by Stripe';
COMMENT ON COLUMN bookings.amount_refunded_cents IS 'Cumulative amount refunded to the passenger, in cents';
COMMENT ON COLUMN bookings.captured_at IS 'When the payment was captured (funds moved to the driver)';
COMMENT ON COLUMN bookings.refunded_at IS 'When the most recent refund was issued';

-- Earnings queries filter on captured payments over a date range.
CREATE INDEX IF NOT EXISTS idx_bookings_captured_at
  ON bookings (captured_at)
  WHERE captured_at IS NOT NULL;

-- ── Read model for the admin earnings dashboard ──────────────────────────────
-- Net revenue is the fee we kept minus the fee reversed on refunds. The fee is
-- reversed proportionally to the refunded amount (we always refund in full and
-- pass refund_application_fee: true, so in practice this is all-or-nothing).
CREATE OR REPLACE VIEW admin_platform_earnings
WITH (security_invoker = true) AS
SELECT
  b.id                AS booking_id,
  b.ride_id,
  b.passenger_id,
  r.driver_id,
  r.from_city,
  r.to_city,
  b.currency,
  b.amount_gross_cents,
  b.platform_fee_cents,
  b.amount_refunded_cents,
  CASE
    WHEN b.amount_gross_cents IS NULL OR b.amount_gross_cents = 0 THEN 0
    ELSE b.platform_fee_cents
         - round(b.platform_fee_cents::numeric * b.amount_refunded_cents / b.amount_gross_cents)::integer
  END                 AS net_fee_cents,
  b.captured_at,
  b.refunded_at
FROM bookings b
JOIN rides r ON r.id = b.ride_id
WHERE b.captured_at IS NOT NULL;

COMMENT ON VIEW admin_platform_earnings IS 'Per-booking platform commission, net of refunds. security_invoker: RLS of the querying user applies.';

-- The view is reached only through the service-role client behind withAdmin();
-- no direct grants to anon or authenticated.
REVOKE ALL ON admin_platform_earnings FROM PUBLIC;
REVOKE ALL ON admin_platform_earnings FROM anon;
REVOKE ALL ON admin_platform_earnings FROM authenticated;
