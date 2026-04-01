-- Sprint 3: Reverse Marketplace (Ride Requests) and Intermediate Stops

-- ============================================================
-- 1. RIDE REQUESTS (Passengers looking for rides)
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  time_flexibility TEXT DEFAULT 'exact', -- 'exact', '1h', '3h', 'any'
  seats_needed INTEGER DEFAULT 1,
  max_price DECIMAL DEFAULT NULL,
  notes TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'fulfilled', 'canceled'
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride requests are viewable by everyone"
  ON ride_requests FOR SELECT USING (true);

CREATE POLICY "Users can create their own ride requests"
  ON ride_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ride requests"
  ON ride_requests FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ride requests"
  ON ride_requests FOR DELETE USING (auth.uid() = user_id);

-- Function to notify ride request authors when a matching ride is published
CREATE OR REPLACE FUNCTION notify_matching_ride_requests()
RETURNS TRIGGER AS $$
DECLARE
  req_record RECORD;
BEGIN
  FOR req_record IN
    SELECT * FROM ride_requests
    WHERE status = 'active'
      AND from_city = NEW.from_city
      AND to_city = NEW.to_city
      AND date = NEW.date
      AND (max_price IS NULL OR NEW.price <= max_price)
      AND (seats_needed IS NULL OR NEW.seats >= seats_needed)
  LOOP
    INSERT INTO notifications (user_id, type, title, body, ride_id, read, created_at)
    VALUES (
      req_record.user_id,
      'ride_alert',
      'Un autista ha pubblicato una corsa per te!',
      'Trovato un passaggio da ' || NEW.from_city || ' a ' || NEW.to_city || ' il ' || NEW.date,
      NEW.id,
      FALSE,
      NOW()
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_ride_requests ON rides;
CREATE TRIGGER trg_notify_ride_requests
  AFTER INSERT ON rides
  FOR EACH ROW
  EXECUTE FUNCTION notify_matching_ride_requests();

-- ============================================================
-- 2. RIDE STOPS (Intermediate stops)
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  city TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE ride_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride stops are viewable by everyone"
  ON ride_stops FOR SELECT USING (true);

CREATE POLICY "Drivers can insert stops for their rides"
  ON ride_stops FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM rides WHERE rides.id = ride_id AND rides.driver_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can delete stops for their rides"
  ON ride_stops FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM rides WHERE rides.id = ride_id AND rides.driver_id = auth.uid()
    )
  );

-- Helper function to check if a ride matches a city pair considering stops
CREATE OR REPLACE FUNCTION ride_matches_route(ride_uuid UUID, from_c TEXT, to_c TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  ride_from TEXT;
  ride_to TEXT;
  stop_cities TEXT[];
BEGIN
  SELECT from_city, to_city INTO ride_from, ride_to FROM rides WHERE id = ride_uuid;
  SELECT ARRAY_AGG(city ORDER BY order_index) INTO stop_cities FROM ride_stops WHERE ride_id = ride_uuid;

  -- Direct match
  IF ride_from = from_c AND ride_to = to_c THEN
    RETURN true;
  END IF;

  -- from_c is origin, to_c is a stop or destination
  IF ride_from = from_c THEN
    IF to_c = ride_to THEN RETURN true; END IF;
    IF stop_cities IS NOT NULL AND to_c = ANY(stop_cities) THEN RETURN true; END IF;
  END IF;

  -- from_c is a stop, to_c is destination or later stop
  IF stop_cities IS NOT NULL AND from_c = ANY(stop_cities) THEN
    IF to_c = ride_to THEN RETURN true; END IF;
    -- Check if to_c appears after from_c in stops
    FOR i IN 1..array_length(stop_cities, 1) LOOP
      IF stop_cities[i] = from_c THEN
        FOR j IN (i+1)..array_length(stop_cities, 1) LOOP
          IF stop_cities[j] = to_c THEN RETURN true; END IF;
        END LOOP;
        IF to_c = ride_to THEN RETURN true; END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;
