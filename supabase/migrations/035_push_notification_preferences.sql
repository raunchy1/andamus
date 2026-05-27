-- Migration 035: Push Notification Preferences
-- Add preference toggles for push alerts on profiles table to support full opt-out controls

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_booking_requests BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_booking_confirmed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_new_messages BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_ride_alerts BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.push_booking_requests IS 'Receive push notifications for new booking requests';
COMMENT ON COLUMN public.profiles.push_booking_confirmed IS 'Receive push notifications when a booking is confirmed/rejected';
COMMENT ON COLUMN public.profiles.push_new_messages IS 'Receive push notifications for new chat messages';
COMMENT ON COLUMN public.profiles.push_ride_alerts IS 'Receive push notifications for matching route alerts or commute cues';
