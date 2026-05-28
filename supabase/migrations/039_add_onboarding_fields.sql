-- Migration: Add onboarding fields to profiles table
-- Enables tracking of user progress through the onboarding flow.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('driver','passenger','both'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_zones text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_year integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean DEFAULT false;

-- Add comment on columns
COMMENT ON COLUMN profiles.onboarding_step IS 'The furthest step completed in onboarding: 1=Benvenuto, 2=Profilo, 3=Ruolo, 4=Notifiche';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Flag indicating if the user has completed the onboarding flow';
COMMENT ON COLUMN profiles.role IS 'The main carpooling role of the user (driver, passenger, or both)';
COMMENT ON COLUMN profiles.preferred_zones IS 'Preferred travel zones in Sardinia (e.g. Cagliari, Sassari)';
COMMENT ON COLUMN profiles.birth_year IS 'The birth year of the user, used to verify age';
COMMENT ON COLUMN profiles.push_notifications_enabled IS 'Flag indicating if the user opted in for push notifications';
