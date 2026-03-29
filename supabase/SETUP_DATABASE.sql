-- ============================================================
-- ANDAMUS DATABASE SETUP
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  rating DECIMAL DEFAULT 5.0,
  rides_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Verification fields
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  id_verified BOOLEAN DEFAULT FALSE,
  driver_verified BOOLEAN DEFAULT FALSE,
  phone_number TEXT
);

-- ============================================================
-- 2. RIDES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  seats INTEGER NOT NULL,
  price DECIMAL DEFAULT 0,
  notes TEXT,
  meeting_point TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. BOOKINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  reviewed_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ride_id, reviewer_id)
);

-- ============================================================
-- 6. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking_request', 'booking_accepted', 'booking_rejected', 'new_message', 'new_review'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. VERIFICATIONS TABLE (KYC)
-- ============================================================
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

-- ============================================================
-- 8. SAFETY REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id),
  reported_id UUID REFERENCES profiles(id),
  ride_id UUID REFERENCES rides(id),
  type TEXT NOT NULL, -- 'inappropriate_behavior', 'no_show', 'fake_profile', 'unsafe_driving', 'harassment', 'other'
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Rides policies
CREATE POLICY "Rides are viewable by everyone" ON rides FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rides" ON rides FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can update their own rides" ON rides FOR UPDATE USING (auth.uid() = driver_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "Drivers can view bookings for their rides" ON bookings FOR SELECT USING (auth.uid() = (SELECT driver_id FROM rides WHERE id = ride_id));
CREATE POLICY "Authenticated users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE USING (auth.uid() = passenger_id);

-- Messages policies
CREATE POLICY "Users can view messages in their bookings" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = (SELECT passenger_id FROM bookings WHERE id = booking_id));
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Verifications policies
CREATE POLICY "Users can view their own verifications" ON verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own verifications" ON verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Safety reports policies
CREATE POLICY "Users can create reports" ON safety_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON safety_reports FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() = reported_id);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update user rating when review is created
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET rating = (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) 
    FROM reviews 
    WHERE reviewed_id = NEW.reviewed_id
  ) 
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_user_rating();

DROP TRIGGER IF EXISTS on_review_updated ON reviews;
CREATE TRIGGER on_review_updated
  AFTER UPDATE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_user_rating();

-- Function to get unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM notifications WHERE user_id = user_uuid AND read = FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get verification level
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

-- ============================================================
-- STORAGE BUCKET FOR VERIFICATION DOCUMENTS
-- ============================================================
-- Run this in Storage section of Supabase Dashboard:
-- Create bucket: "verifications"
-- Set to: "Public bucket"
-- Allowed MIME types: image/png, image/jpeg
-- Max file size: 5MB

-- ============================================================
-- DONE! Your database is ready for Andamus app
-- ============================================================
