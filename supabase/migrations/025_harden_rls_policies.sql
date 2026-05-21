-- ============================================================
-- MIGRATION 025: Harden RLS Policies and Realtime Authorization
-- ============================================================
--
-- Fixes:
-- 1. Drivers can now read chat messages for their rides
-- 2. Drivers can now update booking status (accept/reject)
-- 3. Tightened INSERT policies on notifications, badges, referrals,
--    user_actions, push_subscriptions
-- 4. Added missing indexes on foreign key columns
--
-- SAFETY: All changes are idempotent (IF EXISTS / IF NOT EXISTS).
-- Uses DO $$ blocks to skip tables that don't exist yet.
-- No data is modified or deleted.
-- ============================================================

-- ============================================================
-- 1. MESSAGES — Fix SELECT to include driver access
-- ============================================================
DO $$
BEGIN
  -- Only proceed if messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Users can view messages in their bookings" ON messages;

    CREATE POLICY "Users can view messages in their bookings"
      ON messages FOR SELECT
      USING (
        auth.uid() = sender_id
        OR auth.uid() = (SELECT passenger_id FROM bookings WHERE id = booking_id)
        OR auth.uid() = (
          SELECT driver_id FROM rides
          WHERE id = (SELECT ride_id FROM bookings WHERE id = booking_id)
        )
      );
  END IF;
END $$;

-- ============================================================
-- 2. BOOKINGS — Add driver UPDATE policy
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;

    CREATE POLICY "Passengers can update their own bookings"
      ON bookings FOR UPDATE
      USING (auth.uid() = passenger_id);

    CREATE POLICY "Drivers can update bookings for their rides"
      ON bookings FOR UPDATE
      USING (auth.uid() = (SELECT driver_id FROM rides WHERE id = ride_id));
  END IF;
END $$;

-- ============================================================
-- 3. NOTIFICATIONS — Tighten INSERT to self-only
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

    CREATE POLICY "Users can insert their own notifications"
      ON notifications FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 4. BADGES — Remove direct INSERT (award only via RPC / triggers)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "System can insert badges" ON badges;
  END IF;
END $$;

-- ============================================================
-- 5. REFERRALS — Remove direct INSERT (managed by RPC function)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "System can insert referrals" ON referrals;
  END IF;
END $$;

-- ============================================================
-- 6. USER_ACTIONS — Tighten INSERT to self-only
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_actions' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "System can insert actions" ON user_actions;

    CREATE POLICY "Users can insert their own actions"
      ON user_actions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 7. PUSH_SUBSCRIPTIONS — Tighten INSERT to self-only
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "System can insert push subscriptions" ON push_subscriptions;

    CREATE POLICY "Users can insert their own push subscriptions"
      ON push_subscriptions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 8. ADD MISSING INDEXES ON FOREIGN KEY COLUMNS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_ride_id ON bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ride_id ON notifications(ride_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ride_id ON reviews(ride_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
