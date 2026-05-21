-- Migration 029: Growth, Retention & Premium Experience Sprint
-- Tables: beta_feedback, user_activity_weeks
-- Indexes and RLS policies

-- ── Beta Feedback Table ──
CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('praise', 'issue', 'idea')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_user ON beta_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON beta_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_resolved ON beta_feedback(resolved_at) WHERE resolved_at IS NULL;

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view own feedback"
  ON beta_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── User Activity Weeks (Streak Tracking) ──
CREATE TABLE IF NOT EXISTS user_activity_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_key DATE NOT NULL, -- Monday of the week
  ride_published BOOLEAN NOT NULL DEFAULT false,
  booking_made BOOLEAN NOT NULL DEFAULT false,
  review_submitted BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_key)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_weeks_user ON user_activity_weeks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_weeks_week ON user_activity_weeks(week_key DESC);

ALTER TABLE user_activity_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity weeks"
  ON user_activity_weeks FOR SELECT
  USING (auth.uid() = user_id);

-- ── Add locale + push preference to profiles if missing ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'locale'
  ) THEN
    ALTER TABLE profiles ADD COLUMN locale TEXT DEFAULT 'it';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'push_notifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN push_notifications BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ── Update profiles: add last_active_at if missing ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_active_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);
  END IF;
END $$;

-- ── Function to update last_active_at ──
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_active_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user_activity_weeks to update last_active_at
DROP TRIGGER IF EXISTS trg_update_last_active ON user_activity_weeks;
CREATE TRIGGER trg_update_last_active
  AFTER INSERT ON user_activity_weeks
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();
