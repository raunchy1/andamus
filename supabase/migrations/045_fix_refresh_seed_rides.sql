-- ============================================================
-- MIGRATION 045: Fix refresh_expired_seed_rides()
-- ============================================================
--
-- The function from migration 037 references rides.updated_at, a column
-- that does not exist in production, so every invocation (nightly
-- /api/admin/refresh-rides cron) failed with 42703 and the seeded
-- marketplace silently went stale. Recreate the function without the
-- phantom column. Idempotent (CREATE OR REPLACE).
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
  -- Push expired-but-active seeded rides forward by 1-30 days
  UPDATE public.rides
  SET
    date = (today_date + (FLOOR(RANDOM() * 30) + 1)::INTEGER)
  WHERE
    status = 'active'
    AND date < today_date
    AND driver_id IN (
      SELECT id FROM public.profiles
      WHERE email LIKE '%@andamus.it'
    );

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION refresh_expired_seed_rides() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_expired_seed_rides() TO service_role;

COMMENT ON FUNCTION refresh_expired_seed_rides() IS
  'Pushes expired seeded ride dates forward by 1-30 days to keep the marketplace active. '
  'Only affects rides from @andamus.it seed accounts. Fixed in 045: removed reference to '
  'nonexistent rides.updated_at column that made every call fail.';
