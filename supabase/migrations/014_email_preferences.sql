-- Add email notification preferences to profiles table
-- Sprint 2: Email Preferences Feature

-- Add columns for email notification preferences
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_booking_requests BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_booking_confirmed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_new_messages BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_ride_reminders BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.email_booking_requests IS 'Notify user about new booking requests for their rides';
COMMENT ON COLUMN profiles.email_booking_confirmed IS 'Notify user when their booking is confirmed/rejected';
COMMENT ON COLUMN profiles.email_new_messages IS 'Notify user about new chat messages';
COMMENT ON COLUMN profiles.email_ride_reminders IS 'Notify user about upcoming rides';
COMMENT ON COLUMN profiles.email_marketing IS 'Receive marketing and promotional emails';
