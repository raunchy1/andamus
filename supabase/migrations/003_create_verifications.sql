-- Create verifications table for KYC
CREATE TABLE IF NOT EXISTS verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'phone', 'email', 'id_document', 'driver_license'
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  document_url TEXT,
  verified_at TIMESTAMP,
  rejected_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own verifications" 
  ON verifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications" 
  ON verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update profiles to add verification level
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS driver_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Function to calculate verification level
CREATE OR REPLACE FUNCTION get_verification_level(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO v_count FROM verifications 
  WHERE user_id = user_uuid AND status = 'approved';
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Create safety reports table
CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id),
  reported_id UUID REFERENCES profiles(id),
  ride_id UUID REFERENCES rides(id),
  type TEXT NOT NULL, -- 'inappropriate_behavior', 'no_show', 'fake_profile', 'other'
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" 
  ON safety_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
  ON safety_reports FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() = reported_id);
