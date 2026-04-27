-- Prevent duplicate active bookings for the same user on the same ride
-- First remove any existing duplicates (keep the most recent)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY ride_id, passenger_id ORDER BY created_at DESC) as rn
  FROM bookings
)
DELETE FROM bookings
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint
ALTER TABLE bookings
ADD CONSTRAINT unique_ride_passenger UNIQUE (ride_id, passenger_id);
