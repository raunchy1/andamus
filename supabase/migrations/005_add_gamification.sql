-- Add gamification fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Viaggiatore';

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'first_ride', 'welcome', 'verified', 'five_stars', 'habitue', 'ambassador'
  earned_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Policies for badges
CREATE POLICY "Badges viewable by everyone" 
  ON badges FOR SELECT USING (true);

CREATE POLICY "System can insert badges" 
  ON badges FOR INSERT WITH CHECK (true);

-- Function to calculate level based on points
CREATE OR REPLACE FUNCTION calculate_level(user_points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF user_points >= 1000 THEN
    RETURN 'Leggenda Sarda';
  ELSIF user_points >= 600 THEN
    RETURN 'Re della Strada';
  ELSIF user_points >= 300 THEN
    RETURN 'Sardo DOC';
  ELSIF user_points >= 100 THEN
    RETURN 'Esploratore';
  ELSE
    RETURN 'Viaggiatore';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get level emoji
CREATE OR REPLACE FUNCTION get_level_emoji(user_level TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE user_level
    WHEN 'Viaggiatore' THEN RETURN '🚗';
    WHEN 'Esploratore' THEN RETURN '🗺️';
    WHEN 'Sardo DOC' THEN RETURN '🦁';
    WHEN 'Re della Strada' THEN RETURN '👑';
    WHEN 'Leggenda Sarda' THEN RETURN '⭐';
    ELSE RETURN '🚗';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get next level threshold
CREATE OR REPLACE FUNCTION get_next_level_threshold(user_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF user_points >= 1000 THEN
    RETURN 1000; -- Max level
  ELSIF user_points >= 600 THEN
    RETURN 1000;
  ELSIF user_points >= 300 THEN
    RETURN 600;
  ELSIF user_points >= 100 THEN
    RETURN 300;
  ELSE
    RETURN 100;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badge
CREATE OR REPLACE FUNCTION check_and_award_badge(
  user_uuid UUID,
  badge_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  badge_exists BOOLEAN;
BEGIN
  -- Check if badge already exists
  SELECT EXISTS(
    SELECT 1 FROM badges 
    WHERE user_id = user_uuid AND type = badge_type
  ) INTO badge_exists;
  
  -- Award badge if not exists
  IF NOT badge_exists THEN
    INSERT INTO badges (user_id, type) VALUES (user_uuid, badge_type);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to add points and update level
CREATE OR REPLACE FUNCTION add_user_points(
  user_uuid UUID,
  points_to_add INTEGER
) RETURNS TABLE (new_points INTEGER, new_level TEXT, leveled_up BOOLEAN) AS $$
DECLARE
  current_points INTEGER;
  current_level TEXT;
  updated_level TEXT;
  was_level_up BOOLEAN := false;
BEGIN
  -- Get current points
  SELECT points, level INTO current_points, current_level
  FROM profiles WHERE id = user_uuid;
  
  -- Update points
  UPDATE profiles 
  SET points = COALESCE(points, 0) + points_to_add
  WHERE id = user_uuid;
  
  -- Get new points
  SELECT points INTO new_points FROM profiles WHERE id = user_uuid;
  
  -- Calculate new level
  updated_level := calculate_level(new_points);
  
  -- Check if leveled up
  IF updated_level != current_level THEN
    UPDATE profiles SET level = updated_level WHERE id = user_uuid;
    was_level_up := true;
  END IF;
  
  new_level := updated_level;
  leveled_up := was_level_up;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
