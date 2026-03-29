-- Create reviews table
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

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Reviews are viewable by everyone" 
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" 
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Function to update user rating automatically
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

-- Trigger to auto-update rating
DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_user_rating();

-- Also update on review update (in case of edit in future)
DROP TRIGGER IF EXISTS on_review_updated ON reviews;
CREATE TRIGGER on_review_updated
  AFTER UPDATE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_user_rating();
