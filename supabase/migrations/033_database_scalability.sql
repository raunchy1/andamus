-- Migration 033: Database Scalability & Performance Optimization
-- Purpose: Prepare the database for 100K+ users with proper indexing,
-- materialized views, partition-ready design, and analytics infrastructure.
-- Applied: 2026-05-24

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================
-- 2. COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================

-- Rides: primary search pattern (from_city, to_city, date, status)
-- This is the most critical index for the search feature
CREATE INDEX IF NOT EXISTS idx_rides_search_composite
  ON rides(from_city, to_city, date, status)
  WHERE status = 'active';

-- Rides: feed ordering by creation time
CREATE INDEX IF NOT EXISTS idx_rides_created_at_desc
  ON rides(created_at DESC);

-- Rides: upcoming rides for a driver (dashboard)
CREATE INDEX IF NOT EXISTS idx_rides_driver_date
  ON rides(driver_id, date, time)
  WHERE status = 'active';

-- Rides: geo-search support via from_city pattern
CREATE INDEX IF NOT EXISTS idx_rides_from_city_trgm
  ON rides USING gin (from_city gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_rides_to_city_trgm
  ON rides USING gin (to_city gin_trgm_ops);

-- Rides: price range queries
CREATE INDEX IF NOT EXISTS idx_rides_price
  ON rides(price)
  WHERE status = 'active';

-- Bookings: passenger history with ride join optimization
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_created
  ON bookings(passenger_id, created_at DESC);

-- Bookings: driver request management
CREATE INDEX IF NOT EXISTS idx_bookings_ride_status
  ON bookings(ride_id, status)
  WHERE status = 'pending';

-- Bookings: status transitions for analytics
CREATE INDEX IF NOT EXISTS idx_bookings_status_created
  ON bookings(status, created_at DESC);

-- Messages: chat room ordering (critical for realtime chat)
CREATE INDEX IF NOT EXISTS idx_messages_booking_created
  ON messages(booking_id, created_at DESC);

-- Messages: unread count per user per booking
CREATE INDEX IF NOT EXISTS idx_messages_booking_sender_read
  ON messages(booking_id, sender_id, read)
  WHERE read = false;

-- Notifications: user feed ordering
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- Notifications: unread per type for batching
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_type
  ON notifications(user_id, read, type)
  WHERE read = false;

-- Reviews: profile review feed
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_created
  ON reviews(reviewed_id, created_at DESC);

-- Reviews: reviewer history
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_created
  ON reviews(reviewer_id, created_at DESC);

-- Profiles: driver ranking by rating
CREATE INDEX IF NOT EXISTS idx_profiles_rating
  ON profiles(rating DESC)
  WHERE rides_count > 0;

-- Profiles: cohort analysis by signup date
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON profiles(created_at DESC);

-- Profiles: trust score for matching
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_profiles_trust_score
  ON profiles(trust_score DESC NULLS LAST);

-- Carpool groups: slug lookup (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'carpool_groups' AND column_name = 'slug'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_carpool_groups_slug ON carpool_groups(slug);
  END IF;
END $$;

-- Events: upcoming events listing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'start_date') THEN
    CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'slug') THEN
    CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
  END IF;
END $$;

-- Group memberships: member lookups
CREATE INDEX IF NOT EXISTS idx_group_memberships_user
  ON group_memberships(user_id, joined_at DESC);

-- Group memberships: group member list
CREATE INDEX IF NOT EXISTS idx_group_memberships_group
  ON group_memberships(group_id, joined_at DESC);

-- Optional indexes (only if tables/columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ride_stops') THEN
    CREATE INDEX IF NOT EXISTS idx_ride_stops_ride_order ON ride_stops(ride_id, order_index);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON subscriptions(user_id, status) WHERE status = 'active';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'safety_reports') THEN
    CREATE INDEX IF NOT EXISTS idx_safety_reports_status_created ON safety_reports(status, created_at DESC) WHERE status = 'open';
  END IF;
END $$;

-- User roles: role-based lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_role_user
  ON public.user_roles(role, user_id);

-- ============================================
-- 3. ANALYTICS TABLES (time-series ready)
-- ============================================

-- Daily metrics rollup for fast dashboard queries
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  dau INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  new_rides INTEGER DEFAULT 0,
  new_bookings INTEGER DEFAULT 0,
  confirmed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  avg_ride_price DECIMAL(8,2) DEFAULT 0,
  avg_search_latency_ms INTEGER DEFAULT 0,
  push_notifications_sent INTEGER DEFAULT 0,
  push_notifications_delivered INTEGER DEFAULT 0,
  reports_submitted INTEGER DEFAULT 0,
  reports_resolved INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date
  ON daily_metrics(date DESC);

-- Hourly metrics for real-time monitoring
CREATE TABLE IF NOT EXISTS hourly_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hour TIMESTAMP NOT NULL,
  endpoint TEXT NOT NULL,
  requests INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  p95_latency_ms INTEGER DEFAULT 0,
  p99_latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hourly_metrics_hour_endpoint
  ON hourly_metrics(hour DESC, endpoint);

-- Ensure optional profile columns exist for analytics views
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;

-- ============================================
-- 4. MATERIALIZED VIEWS FOR DASHBOARDS
-- ============================================

-- Popular routes (pre-computed for trending/homepage)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_routes AS
SELECT
  from_city,
  to_city,
  COUNT(*) AS ride_count,
  COUNT(DISTINCT driver_id) AS driver_count,
  AVG(price) AS avg_price,
  MIN(price) AS min_price,
  MAX(price) AS max_price,
  MAX(created_at) AS last_ride_at
FROM rides
WHERE status = 'active'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY from_city, to_city
HAVING COUNT(*) >= 2
ORDER BY ride_count DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_popular_routes
  ON mv_popular_routes(from_city, to_city);

-- Driver leaderboard (pre-computed reputation)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_driver_leaderboard AS
SELECT
  p.id,
  p.name,
  p.avatar_url,
  p.rating,
  p.review_count,
  p.rides_count,
  p.completed_rides_count,
  p.trust_score,
  p.phone_verified,
  p.id_verified,
  COUNT(DISTINCT r.id) AS recent_rides,
  AVG(r.price) AS avg_recent_price
FROM profiles p
LEFT JOIN rides r ON r.driver_id = p.id
  AND r.status = 'active'
  AND r.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE p.rides_count > 0
GROUP BY p.id, p.name, p.avatar_url, p.rating, p.review_count,
         p.rides_count, p.completed_rides_count, p.trust_score,
         p.phone_verified, p.id_verified
ORDER BY p.rating DESC, p.review_count DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_driver_leaderboard
  ON mv_driver_leaderboard(id);

-- Daily ride stats (for analytics charts)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_ride_stats AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) FILTER (WHERE status = 'active') AS active_rides,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_rides,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_rides,
  COUNT(DISTINCT driver_id) AS active_drivers,
  AVG(price) AS avg_price,
  SUM(price) AS total_value
FROM rides
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_ride_stats
  ON mv_daily_ride_stats(date);

-- Booking conversion funnel (daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_booking_stats AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS total_bookings,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  COUNT(DISTINCT passenger_id) AS unique_passengers,
  COUNT(DISTINCT ride_id) AS unique_rides
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_booking_stats
  ON mv_daily_booking_stats(date);

-- ============================================
-- 5. MODERATION TABLES
-- ============================================

-- Content reports (user-generated content moderation)
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  reported_content_id UUID,
  content_type TEXT NOT NULL CHECK (content_type IN ('ride', 'message', 'review', 'profile', 'group', 'event')),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed', 'escalated')),
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status
  ON content_reports(status, created_at DESC)
  WHERE status IN ('pending', 'under_review', 'escalated');

CREATE INDEX IF NOT EXISTS idx_content_reports_reported_user
  ON content_reports(reported_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter
  ON content_reports(reporter_id, created_at DESC);

-- User blocks (privacy/safety)
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker
  ON user_blocks(blocker_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
  ON user_blocks(blocked_id);

-- Moderation audit log
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'suspend', 'ban', 'unban', 'delete_content', 'dismiss_report', 'escalate', 'note')),
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_report_id UUID REFERENCES content_reports(id) ON DELETE SET NULL,
  details JSONB,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator
  ON moderation_actions(moderator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user
  ON moderation_actions(target_user_id, created_at DESC);

-- ============================================
-- 6. SEARCH INFRASTRUCTURE
-- ============================================

-- Full-text search vector for rides
ALTER TABLE rides ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_rides_search_vector
  ON rides USING gin(search_vector);

-- Trigger to update search vector
CREATE OR REPLACE FUNCTION update_ride_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.from_city, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.to_city, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.meeting_point, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rides_search_vector ON rides;
CREATE TRIGGER trg_rides_search_vector
  BEFORE INSERT OR UPDATE ON rides
  FOR EACH ROW
  EXECUTE FUNCTION update_ride_search_vector();

-- Backfill existing rides
UPDATE rides
SET search_vector =
  setweight(to_tsvector('simple', COALESCE(from_city, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(to_city, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(meeting_point, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(notes, '')), 'C')
WHERE search_vector IS NULL;

-- ============================================
-- 7. PARTITION-READY TABLE DESIGN
-- ============================================

-- Event log for audit trail (partition-ready)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  session_id TEXT,
  ip_address INET,
  PRIMARY KEY (id, changed_at)
) PARTITION BY RANGE (changed_at);

-- Initial partitions
CREATE TABLE IF NOT EXISTS audit_log_2026_05 PARTITION OF audit_log
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS audit_log_2026_06 PARTITION OF audit_log
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE INDEX IF NOT EXISTS idx_audit_log_record
  ON audit_log(table_name, record_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by
  ON audit_log(changed_by, changed_at DESC);

-- ============================================
-- 8. REFRESH FUNCTIONS
-- ============================================

-- Function to refresh all materialized views concurrently
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_routes;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_driver_leaderboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_ride_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_booking_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to create next audit log partition
CREATE OR REPLACE FUNCTION create_audit_log_partition()
RETURNS void AS $$
DECLARE
  next_month DATE;
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  next_month := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  partition_name := 'audit_log_' || TO_CHAR(next_month, 'YYYY_MM');
  start_date := next_month;
  end_date := next_month + INTERVAL '1 month';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. RLS POLICIES FOR NEW TABLES
-- ============================================

-- Content reports: users can create reports, admins can see all
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;
CREATE POLICY "Users can view their own reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all reports" ON content_reports;
CREATE POLICY "Admins can manage all reports"
  ON content_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User blocks: users manage their own blocks
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own blocks" ON user_blocks;
CREATE POLICY "Users manage own blocks"
  ON user_blocks FOR ALL
  TO authenticated
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());

-- Moderation actions: admin-only
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view moderation actions" ON moderation_actions;
CREATE POLICY "Admins can view moderation actions"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create moderation actions" ON moderation_actions;
CREATE POLICY "Admins can create moderation actions"
  ON moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Daily metrics: admin-only read
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read daily metrics" ON daily_metrics;
CREATE POLICY "Admins can read daily metrics"
  ON daily_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Hourly metrics: admin-only read
ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read hourly metrics" ON hourly_metrics;
CREATE POLICY "Admins can read hourly metrics"
  ON hourly_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Audit log: admin-only
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit log" ON audit_log;
CREATE POLICY "Admins can read audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 10. AUTO-UPDATE TRIGGER FOR daily_metrics
-- ============================================

CREATE OR REPLACE FUNCTION update_daily_metrics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_metrics_updated ON daily_metrics;
CREATE TRIGGER trg_daily_metrics_updated
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_metrics_timestamp();
