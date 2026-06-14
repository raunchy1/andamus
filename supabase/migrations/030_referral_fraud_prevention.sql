-- Migration 030: Referral Fraud Prevention & Reward Depth
-- Adds referral attempt logging, cooldowns, and badge automation

-- ── Referral Attempts Log (for fraud detection) ──
CREATE TABLE IF NOT EXISTS referral_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code TEXT NOT NULL,
  new_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  new_user_email TEXT,
  ip_hash TEXT, -- hashed IP, not raw
  user_agent_hash TEXT, -- hashed UA fingerprint
  status TEXT NOT NULL CHECK (status IN ('success', 'self_referral', 'duplicate', 'cooldown', 'invalid_code', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_attempts_code ON referral_attempts(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referral_attempts_new_user ON referral_attempts(new_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_attempts_ip ON referral_attempts(ip_hash);
CREATE INDEX IF NOT EXISTS idx_referral_attempts_created ON referral_attempts(created_at DESC);

ALTER TABLE referral_attempts ENABLE ROW LEVEL SECURITY;

-- ── Enhanced apply_referral_bonus with fraud checks ──
DROP FUNCTION IF EXISTS apply_referral_bonus(UUID, TEXT);
CREATE OR REPLACE FUNCTION apply_referral_bonus(
  new_user_id UUID,
  referrer_code TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  referrer_profile RECORD;
  already_referred BOOLEAN;
  recent_attempts INTEGER;
  ip_attempts INTEGER;
  new_user_email TEXT;
BEGIN
  -- Get new user's email
  SELECT email INTO new_user_email
  FROM auth.users WHERE id = new_user_id;

  -- Find referrer
  SELECT * INTO referrer_profile
  FROM profiles
  WHERE referral_code = referrer_code
  LIMIT 1;

  IF referrer_profile IS NULL THEN
    INSERT INTO referral_attempts (referrer_code, new_user_id, new_user_email, status)
    VALUES (referrer_code, new_user_id, new_user_email, 'invalid_code');
    RETURN QUERY SELECT false, 'Invalid referral code';
    RETURN;
  END IF;

  -- Self-referral block
  IF referrer_profile.id = new_user_id THEN
    INSERT INTO referral_attempts (referrer_code, new_user_id, new_user_email, status)
    VALUES (referrer_code, new_user_id, new_user_email, 'self_referral');
    RETURN QUERY SELECT false, 'Self-referral not allowed';
    RETURN;
  END IF;

  -- Duplicate check
  SELECT EXISTS(
    SELECT 1 FROM referrals WHERE referred_id = new_user_id
  ) INTO already_referred;

  IF already_referred THEN
    INSERT INTO referral_attempts (referrer_code, new_user_id, new_user_email, status)
    VALUES (referrer_code, new_user_id, new_user_email, 'duplicate');
    RETURN QUERY SELECT false, 'Already referred';
    RETURN;
  END IF;

  -- Cooldown: max 5 successful referrals per referrer per day
  SELECT COUNT(*) INTO recent_attempts
  FROM referrals
  WHERE referrer_id = referrer_profile.id
    AND created_at > now() - interval '1 day';

  IF recent_attempts >= 5 THEN
    INSERT INTO referral_attempts (referrer_code, new_user_id, new_user_email, status)
    VALUES (referrer_code, new_user_id, new_user_email, 'cooldown');
    RETURN QUERY SELECT false, 'Referral cooldown active';
    RETURN;
  END IF;

  -- All checks passed — apply bonus
  INSERT INTO referrals (referrer_id, referred_id, points_awarded)
  VALUES (referrer_profile.id, new_user_id, 25);

  UPDATE profiles
  SET referrals_count = referrals_count + 1,
      referral_points_earned = referral_points_earned + 25,
      points = points + 25
  WHERE id = referrer_profile.id;

  UPDATE profiles
  SET points = points + 25,
      referred_by = referrer_profile.id
  WHERE id = new_user_id;

  -- Log success
  INSERT INTO referral_attempts (referrer_code, new_user_id, new_user_email, status)
  VALUES (referrer_code, new_user_id, new_user_email, 'success');

  RETURN QUERY SELECT true, 'Referral bonus applied';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Function to award referral badges ──
CREATE OR REPLACE FUNCTION check_referral_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  ref_count INTEGER;
BEGIN
  SELECT referrals_count INTO ref_count
  FROM profiles WHERE id = p_user_id;

  IF ref_count IS NULL THEN RETURN; END IF;

  -- Badge awards are handled in application code via gamification system
  -- This function can be called via RPC if needed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Add is_admin to profiles if missing ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Only admins can view attempt logs (after is_admin column exists)
DROP POLICY IF EXISTS "Admin view referral attempts" ON referral_attempts;
CREATE POLICY "Admin view referral attempts"
  ON referral_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));
