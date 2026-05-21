-- ============================================================
-- MIGRATION 026: Restore notifications table and stabilize system
-- ============================================================
--
-- Creates:
-- - notifications table (if missing)
-- - RLS policies (SELECT, INSERT, UPDATE)
-- - Indexes for performance
-- - Unread count helper function
--
-- SAFETY: Fully idempotent. All statements use IF NOT EXISTS.
-- ============================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DO $$
BEGIN
  -- SELECT: users view only their own notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
      ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- INSERT: server actions use service role; tighten direct client inserts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Users can insert their own notifications'
  ) THEN
    CREATE POLICY "Users can insert their own notifications"
      ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- UPDATE: users can only update their own notifications (mark as read)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications"
      ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_ride_id ON notifications(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id);

-- 5. Helper function for unread count
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM notifications WHERE user_id = user_uuid AND read = FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
