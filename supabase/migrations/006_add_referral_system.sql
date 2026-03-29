-- Add referral system fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referrals_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_points_earned INTEGER DEFAULT 0;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points_awarded INTEGER DEFAULT 25,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referrals
CREATE POLICY "Users can view their own referrals" 
  ON referrals FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referrals" 
  ON referrals FOR INSERT WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'AND-';
  i INTEGER := 0;
  pos INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    pos := 1 + floor(random() * length(chars));
    result := result || substring(chars from pos for 1);
  END LOOP;
  
  -- Check if code already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE referral_code = result) THEN
    RETURN generate_referral_code();
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to apply referral bonus
CREATE OR REPLACE FUNCTION apply_referral_bonus(
  new_user_id UUID,
  referrer_code TEXT
) RETURNS TABLE (
  success BOOLEAN,
  referrer_id UUID,
  points_added INTEGER
) AS $$
DECLARE
  referrer_profile profiles%ROWTYPE;
  referral_points INTEGER := 25;
BEGIN
  -- Find referrer by code
  SELECT * INTO referrer_profile 
  FROM profiles 
  WHERE referral_code = referrer_code;
  
  IF referrer_profile IS NULL THEN
    success := false;
    referrer_id := NULL;
    points_added := 0;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check if user is trying to refer themselves
  IF referrer_profile.id = new_user_id THEN
    success := false;
    referrer_id := NULL;
    points_added := 0;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check if new user was already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = new_user_id) THEN
    success := false;
    referrer_id := NULL;
    points_added := 0;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, points_awarded)
  VALUES (referrer_profile.id, new_user_id, referral_points);
  
  -- Update referrer profile
  UPDATE profiles 
  SET 
    referrals_count = referrals_count + 1,
    referral_points_earned = referral_points_earned + referral_points,
    points = points + referral_points
  WHERE id = referrer_profile.id;
  
  -- Update new user profile (referred_by and points)
  UPDATE profiles 
  SET 
    referred_by = referrer_profile.id,
    points = points + referral_points
  WHERE id = new_user_id;
  
  success := true;
  referrer_id := referrer_profile.id;
  points_added := referral_points;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate unique referral code
  new_code := generate_referral_code();
  
  INSERT INTO public.profiles (id, name, avatar_url, referral_code)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new_code);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  referrals_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.name as user_name,
    p.avatar_url as user_avatar,
    COUNT(r.id) as referrals_count
  FROM profiles p
  LEFT JOIN referrals r ON p.id = r.referrer_id
  WHERE r.created_at >= date_trunc('month', NOW())
     OR r.created_at IS NULL
  GROUP BY p.id, p.name, p.avatar_url
  ORDER BY referrals_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
