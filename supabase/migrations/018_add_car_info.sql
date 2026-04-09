-- Migration: Add car information to rides table
-- Created: 2026-01-07

-- Add car info columns to rides table
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS car_model TEXT,
ADD COLUMN IF NOT EXISTS car_color TEXT,
ADD COLUMN IF NOT EXISTS car_plate TEXT,
ADD COLUMN IF NOT EXISTS car_year INTEGER;

-- Add car info to profiles table (for driver's default car)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS car_model TEXT,
ADD COLUMN IF NOT EXISTS car_color TEXT,
ADD COLUMN IF NOT EXISTS car_plate TEXT,
ADD COLUMN IF NOT EXISTS car_year INTEGER;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rides_car_plate ON rides(car_plate) WHERE car_plate IS NOT NULL;
