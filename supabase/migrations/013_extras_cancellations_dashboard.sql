-- Extra Features: Booking Cancellations, Disputes, Advanced Driver Dashboard

-- ============================================================
-- 1. BOOKING CANCELLATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_cancellations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  canceled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE booking_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cancellations"
  ON booking_cancellations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = booking_cancellations.booking_id
        AND (bookings.passenger_id = auth.uid() OR bookings.ride_id IN (
          SELECT id FROM rides WHERE driver_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create cancellations for their bookings"
  ON booking_cancellations FOR INSERT WITH CHECK (
    auth.uid() = canceled_by AND (
      EXISTS (
        SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.passenger_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM rides WHERE rides.id = (SELECT ride_id FROM bookings WHERE bookings.id = booking_id) AND rides.driver_id = auth.uid()
      )
    )
  );

-- Add cancellation_penalty_count to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancellation_penalty_count INTEGER DEFAULT 0;

-- Function to increment cancellation penalty
CREATE OR REPLACE FUNCTION increment_cancellation_penalty(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET cancellation_penalty_count = cancellation_penalty_count + 1 WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. DRIVER STATS MATERIALIZED VIEW (optional helper)
-- ============================================================
-- Function to get driver stats
CREATE OR REPLACE FUNCTION get_driver_stats(driver_uuid UUID)
RETURNS TABLE (
  total_rides BIGINT,
  total_km NUMERIC,
  total_co2_saved NUMERIC,
  total_earnings NUMERIC,
  total_passengers BIGINT,
  avg_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT r.id) AS total_rides,
    COALESCE(SUM(
      CASE
        WHEN r.from_city IS NOT NULL AND r.to_city IS NOT NULL THEN
          -- Use a rough fallback since we can't import TS functions
          COALESCE(
            (SELECT distance FROM (
              SELECT CASE
                WHEN (r.from_city = 'Cagliari' AND r.to_city = 'Sassari') OR (r.from_city = 'Sassari' AND r.to_city = 'Cagliari') THEN 180
                WHEN (r.from_city = 'Cagliari' AND r.to_city = 'Olbia') OR (r.from_city = 'Olbia' AND r.to_city = 'Cagliari') THEN 280
                WHEN (r.from_city = 'Sassari' AND r.to_city = 'Olbia') OR (r.from_city = 'Olbia' AND r.to_city = 'Sassari') THEN 90
                WHEN (r.from_city = 'Cagliari' AND r.to_city = 'Nuoro') OR (r.from_city = 'Nuoro' AND r.to_city = 'Cagliari') THEN 180
                WHEN (r.from_city = 'Cagliari' AND r.to_city = 'Oristano') OR (r.from_city = 'Oristano' AND r.to_city = 'Cagliari') THEN 90
                ELSE 60
              END AS distance
            ) sub),
            60
          )
        ELSE 0
      END
    ), 0) AS total_km,
    0::NUMERIC AS total_co2_saved,
    COALESCE(SUM(r.price), 0) AS total_earnings,
    COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed') AS total_passengers,
    COALESCE(AVG(r.price), 0) AS avg_price
  FROM rides r
  LEFT JOIN bookings b ON b.ride_id = r.id
  WHERE r.driver_id = driver_uuid;
END;
$$ LANGUAGE plpgsql;
