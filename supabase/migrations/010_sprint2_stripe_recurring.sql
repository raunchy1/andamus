-- Sprint 2: Stripe Subscriptions and Recurring Rides

-- ============================================================
-- 1. STRIPE SUBSCRIPTION FIELDS ON PROFILES
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive', -- inactive, active, past_due, canceled
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP;

-- subscription_plan already exists on profiles (used by app)

-- ============================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL, -- 'premium', 'driver'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'unpaid', 'incomplete'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  canceled_at TIMESTAMP
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 3. RIDE TEMPLATES (Recurring rides)
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  time TEXT NOT NULL,
  seats INTEGER NOT NULL,
  price DECIMAL NOT NULL DEFAULT 0,
  meeting_point TEXT,
  notes TEXT,
  preferences JSONB DEFAULT NULL,
  recurrence_days INTEGER[] NOT NULL, -- [0,1,2,3,4,5,6] where 0=Monday for pg or 0=Sunday? We'll use ISO: 0=Monday... actually let's use 0=Sunday to match JS getDay()
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ride_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ride templates"
  ON ride_templates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ride templates"
  ON ride_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ride templates"
  ON ride_templates FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ride templates"
  ON ride_templates FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. RIDE INSTANCES (Generated rides from templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES ride_templates(id) ON DELETE CASCADE NOT NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, scheduled_date)
);

ALTER TABLE ride_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ride instances"
  ON ride_instances FOR SELECT USING (
    EXISTS (SELECT 1 FROM ride_templates WHERE ride_templates.id = ride_instances.template_id AND ride_templates.user_id = auth.uid())
  );

-- ============================================================
-- 5. FUNCTION TO GENERATE RECURRING RIDES
-- ============================================================
CREATE OR REPLACE FUNCTION generate_rides_from_templates(
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_template RECORD;
  v_date DATE;
  v_day_of_week INTEGER;
  v_ride_id UUID;
BEGIN
  FOR v_template IN
    SELECT * FROM ride_templates WHERE is_active = TRUE
  LOOP
    v_date := CURRENT_DATE;
    WHILE v_date <= CURRENT_DATE + p_days_ahead LOOP
      v_day_of_week := EXTRACT(DOW FROM v_date)::INTEGER; -- 0=Sunday, 6=Saturday
      IF v_day_of_week = ANY(v_template.recurrence_days) THEN
        -- Check if instance already exists
        IF NOT EXISTS (
          SELECT 1 FROM ride_instances
          WHERE template_id = v_template.id AND scheduled_date = v_date
        ) THEN
          -- Insert ride
          INSERT INTO rides (
            driver_id, from_city, to_city, date, time, seats, price,
            meeting_point, notes,
            smoking_allowed, pets_allowed, large_luggage, music_preference, women_only, students_only,
            status
          ) VALUES (
            v_template.user_id,
            v_template.from_city,
            v_template.to_city,
            v_date,
            v_template.time,
            v_template.seats,
            v_template.price,
            v_template.meeting_point,
            v_template.notes,
            (v_template.preferences->>'smoking_allowed')::BOOLEAN,
            (v_template.preferences->>'pets_allowed')::BOOLEAN,
            (v_template.preferences->>'large_luggage')::BOOLEAN,
            v_template.preferences->>'music_preference',
            (v_template.preferences->>'women_only')::BOOLEAN,
            (v_template.preferences->>'students_only')::BOOLEAN,
            'active'
          )
          RETURNING id INTO v_ride_id;

          -- Insert instance record
          INSERT INTO ride_instances (template_id, ride_id, scheduled_date)
          VALUES (v_template.id, v_ride_id, v_date);

          v_count := v_count + 1;
        END IF;
      END IF;
      v_date := v_date + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
