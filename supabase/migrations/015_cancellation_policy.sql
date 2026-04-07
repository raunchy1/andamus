-- Add cancellation tracking to bookings table
-- Sprint 2: Cancellation Policy Feature

-- Add columns for cancellation tracking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);

-- Add comment for documentation
COMMENT ON COLUMN bookings.cancelled_at IS 'Timestamp when the booking was cancelled';
COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason provided for cancellation';
COMMENT ON COLUMN bookings.cancelled_by IS 'User ID who cancelled the booking (passenger or driver)';

-- Add index for faster queries on cancelled bookings
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- Update existing cancelled bookings to have cancelled_at timestamp if status is 'cancelled'
UPDATE bookings 
SET cancelled_at = COALESCE(updated_at, created_at)
WHERE status = 'cancelled' AND cancelled_at IS NULL;
