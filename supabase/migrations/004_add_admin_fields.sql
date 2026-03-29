-- Add admin fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;

-- Add admin role (using a specific user email)
-- The admin check will be done in the app code using email: cristianermurache@gmail.com

-- Update RLS policy to allow blocked users to still view their own profile
-- But they shouldn't be able to create rides or bookings

-- Policy: Blocked users cannot create rides
DROP POLICY IF EXISTS "Authenticated users can create rides" ON rides;
CREATE POLICY "Authenticated users can create rides" 
  ON rides FOR INSERT WITH CHECK (
    auth.uid() = driver_id 
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_blocked = TRUE
    )
  );

-- Policy: Blocked users cannot create bookings
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
CREATE POLICY "Authenticated users can create bookings" 
  ON bookings FOR INSERT WITH CHECK (
    auth.uid() = passenger_id 
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_blocked = TRUE
    )
  );

-- Function to get admin stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_rides BIGINT,
  total_bookings BIGINT,
  pending_reports BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM rides) as total_rides,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT COUNT(*) FROM safety_reports WHERE status = 'pending') as pending_reports;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
