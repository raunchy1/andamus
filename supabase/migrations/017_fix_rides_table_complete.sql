-- Migration 017: Complete fix for rides table - add ALL missing columns
-- This fixes ALL errors from the /offri form

-- Core columns that might be missing
ALTER TABLE rides ADD COLUMN IF NOT EXISTS meeting_point TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Preference columns (from migration 009 + offri form)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS smoking_allowed BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS large_luggage BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS music_preference TEXT DEFAULT 'qualsiasi';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS women_only BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS students_only BOOLEAN DEFAULT false;

-- Additional preference columns that might be referenced
ALTER TABLE rides ADD COLUMN IF NOT EXISTS fumatori_ammessi BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS animali_ammessi BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS music_in_car TEXT DEFAULT 'qualsiasi';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS baggage_large BOOLEAN DEFAULT false;

-- Recurring ride columns
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_frequency TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_days INTEGER[] DEFAULT '{}';

-- Live tracking
ALTER TABLE rides ADD COLUMN IF NOT EXISTS live_tracking BOOLEAN DEFAULT false;

-- Ensure driver_id exists (critical)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES profiles(id);

-- Ensure from_city, to_city, date, time, seats, price exist with proper types
ALTER TABLE rides ADD COLUMN IF NOT EXISTS from_city TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS to_city TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS time TIME;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 1;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS price DECIMAL DEFAULT 0;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_date ON rides(date);
CREATE INDEX IF NOT EXISTS idx_rides_cities ON rides(from_city, to_city);

-- Comments for clarity
COMMENT ON COLUMN rides.meeting_point IS 'Meeting point for the ride';
COMMENT ON COLUMN rides.smoking_allowed IS 'Whether smoking is allowed';
COMMENT ON COLUMN rides.pets_allowed IS 'Whether pets are allowed';
COMMENT ON COLUMN rides.large_luggage IS 'Whether large luggage is allowed';
COMMENT ON COLUMN rides.music_preference IS 'Music preference (qualsiasi, silenzio, musica, chiacchiere)';
COMMENT ON COLUMN rides.women_only IS 'Women only ride';
COMMENT ON COLUMN rides.students_only IS 'Students only ride';
COMMENT ON COLUMN rides.is_recurring IS 'Is this a recurring ride';
COMMENT ON COLUMN rides.live_tracking IS 'Live GPS tracking enabled';
COMMENT ON COLUMN rides.status IS 'Ride status (active, cancelled, completed)';
