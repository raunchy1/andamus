-- Fix missing columns identified during security audit

-- 1. Add reminder_sent to rides (used by cron ride-reminders)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- 2. Add subscription_plan to profiles (used by stripe webhook)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;

-- 3. Add updated_at to bookings (used by cancellation policy migration)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing cancelled bookings to have cancelled_at timestamp if status is 'cancelled'
UPDATE bookings
SET cancelled_at = COALESCE(updated_at, created_at)
WHERE status = 'cancelled' AND cancelled_at IS NULL;
