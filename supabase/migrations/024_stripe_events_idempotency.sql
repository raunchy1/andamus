-- Stripe webhook idempotency: prevent duplicate processing on retries
-- Safe to apply multiple times (CREATE TABLE IF NOT EXISTS + IF NOT EXISTS index)

CREATE TABLE IF NOT EXISTS stripe_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type       TEXT        NOT NULL,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clean up old events automatically (keep 30 days)
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at
  ON stripe_events (processed_at);

-- RLS: only service role can read/write (webhook uses service role via server client)
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- No public access — accessed only by server-side webhook handler
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stripe_events'
    AND policyname = 'service_role_only'
  ) THEN
    CREATE POLICY service_role_only ON stripe_events
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;
