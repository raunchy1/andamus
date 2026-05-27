-- ============================================================
-- MIGRATION 037: Seed Date Refresh Function
-- ============================================================
--
-- Adds a PostgreSQL function that bumps expired seeded ride dates
-- forward by 30 days. Called by the /api/admin/refresh-rides endpoint.
-- Safe to run multiple times (idempotent).
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_expired_seed_rides()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Update rides that have already passed (date < today) and are still 'active'
  -- Push them forward by calculating a new date 1-30 days from today
  UPDATE public.rides
  SET
    date = (today_date + (FLOOR(RANDOM() * 30) + 1)::INTEGER),
    updated_at = NOW()
  WHERE
    status = 'active'
    AND date < today_date
    AND driver_id IN (
      -- Only refresh rides belonging to known seed users (deterministic UUIDs)
      SELECT id FROM public.profiles
      WHERE email LIKE '%@andamus.it'
    );

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Grant execute to service_role only (called via API with service role key)
REVOKE ALL ON FUNCTION refresh_expired_seed_rides() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_expired_seed_rides() TO service_role;

-- Create index to speed up the refresh query
CREATE INDEX IF NOT EXISTS idx_rides_date_status ON public.rides(date, status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

COMMENT ON FUNCTION refresh_expired_seed_rides() IS
  'Pushes expired seeded ride dates forward by 1-30 days to keep the marketplace active. '
  'Only affects rides from @andamus.it seed accounts.';
