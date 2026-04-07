-- Migration 016: Add missing columns to rides table
-- Fixes errors: "Could not find the 'large_luggage' column of 'rides' in the schema cache"

-- Add all missing preference columns
ALTER TABLE rides ADD COLUMN IF NOT EXISTS large_luggage BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS women_only BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS music_preference TEXT DEFAULT 'qualsiasi';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_days INTEGER[] DEFAULT '{}';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS live_tracking BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure all preference columns from migration 009 exist
ALTER TABLE rides ADD COLUMN IF NOT EXISTS smoking_allowed BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS students_only BOOLEAN DEFAULT false;

-- Add index for better query performance on new columns
CREATE INDEX IF NOT EXISTS idx_rides_preferences ON rides(smoking_allowed, pets_allowed, large_luggage, women_only, students_only);

-- Update RLS policy to include new columns if needed (they inherit from existing policies)
COMMENT ON COLUMN rides.large_luggage IS 'Whether large luggage is allowed';
COMMENT ON COLUMN rides.women_only IS 'Whether ride is women-only';
COMMENT ON COLUMN rides.music_preference IS 'Music preference: qualsiasi, silenzio, musica, chiacchiere';
COMMENT ON COLUMN rides.is_recurring IS 'Whether this is a recurring ride';
COMMENT ON COLUMN rides.recurring_days IS 'Array of days (0-6) for recurring rides';
COMMENT ON COLUMN rides.live_tracking IS 'Whether live GPS tracking is enabled';
COMMENT ON COLUMN rides.notes IS 'Additional notes from driver';
