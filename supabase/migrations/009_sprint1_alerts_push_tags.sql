-- Sprint 1: Ride Alerts, Push Subscriptions, and Travel Preferences

-- ============================================================
-- 1. RIDE PREFERENCES COLUMNS
-- ============================================================
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS smoking_allowed BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS large_luggage BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS music_preference TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS women_only BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS students_only BOOLEAN DEFAULT NULL;

-- ============================================================
-- 2. RIDE ALERTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  min_seats INTEGER DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ride_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ride alerts"
  ON ride_alerts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ride alerts"
  ON ride_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ride alerts"
  ON ride_alerts FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. PUSH SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert push subscriptions"
  ON push_subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. RIDE ALERT TRIGGER (inserts notifications)
-- ============================================================
CREATE OR REPLACE FUNCTION check_ride_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_record RECORD;
BEGIN
  FOR alert_record IN
    SELECT * FROM ride_alerts
    WHERE from_city = NEW.from_city
      AND to_city = NEW.to_city
      AND (start_date IS NULL OR NEW.date >= start_date)
      AND (end_date IS NULL OR NEW.date <= end_date)
      AND (max_price IS NULL OR NEW.price <= max_price)
      AND (min_seats IS NULL OR NEW.seats >= min_seats)
  LOOP
    INSERT INTO notifications (user_id, type, title, body, ride_id, read, created_at)
    VALUES (
      alert_record.user_id,
      'ride_alert',
      'Nuovo passaggio disponibile!',
      'Trovato un passaggio da ' || NEW.from_city || ' a ' || NEW.to_city || ' il ' || NEW.date,
      NEW.id,
      FALSE,
      NOW()
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_ride_alerts ON rides;
CREATE TRIGGER trg_check_ride_alerts
  AFTER INSERT ON rides
  FOR EACH ROW
  EXECUTE FUNCTION check_ride_alerts();
