-- Reputation system enhancement for closed beta

-- Add review_count to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add completed_rides_count to profiles (as passenger)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_rides_count INTEGER DEFAULT 0;

-- Update the rating trigger to also update review_count
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET 
    rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) 
      FROM reviews 
      WHERE reviewed_id = NEW.reviewed_id
    ),
    review_count = (
      SELECT COUNT(*)::integer
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id
    )
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also update on DELETE (in case a review is removed)
CREATE OR REPLACE FUNCTION update_user_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET 
    rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) 
      FROM reviews 
      WHERE reviewed_id = OLD.reviewed_id
    ),
    review_count = (
      SELECT COUNT(*)::integer
      FROM reviews
      WHERE reviewed_id = OLD.reviewed_id
    )
  WHERE id = OLD.reviewed_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_deleted ON reviews;
CREATE TRIGGER on_review_deleted
  AFTER DELETE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_user_rating_on_delete();

-- Function to update completed_rides_count for a user
-- Called when a ride expires or when a booking is confirmed on a completed ride
CREATE OR REPLACE FUNCTION update_completed_rides_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update for the driver
  UPDATE profiles
  SET completed_rides_count = (
    SELECT COUNT(*)::integer
    FROM rides
    WHERE driver_id = NEW.driver_id
      AND status = 'expired'
  )
  WHERE id = NEW.driver_id;

  -- Update for all confirmed passengers
  UPDATE profiles
  SET completed_rides_count = (
    SELECT COUNT(DISTINCT b.ride_id)::integer
    FROM bookings b
    JOIN rides r ON r.id = b.ride_id
    WHERE b.passenger_id = profiles.id
      AND b.status = 'confirmed'
      AND r.status = 'expired'
  )
  WHERE id IN (
    SELECT passenger_id FROM bookings
    WHERE ride_id = NEW.id AND status = 'confirmed'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing review counts
UPDATE profiles
SET review_count = (
  SELECT COUNT(*)::integer
  FROM reviews
  WHERE reviewed_id = profiles.id
);

-- Index for faster review lookups by reviewed user
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
