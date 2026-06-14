-- Migration 032: Add user_roles table and harden RLS policies
-- Run this in Supabase SQL Editor or via supabase db push

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. user_roles table (RBAC)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can read user_roles (via service_role or admin check)
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Only service_role can insert/update/delete
CREATE POLICY "user_roles_service_only"
  ON public.user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. RLS Hardening: Ensure users can only mutate their own resources
-- ──────────────────────────────────────────────────────────────────────────────

-- rides: users can only update/delete their own rides
DROP POLICY IF EXISTS "rides_update_own" ON public.rides;
CREATE POLICY "rides_update_own"
  ON public.rides
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS "rides_delete_own" ON public.rides;
CREATE POLICY "rides_delete_own"
  ON public.rides
  FOR DELETE
  TO authenticated
  USING (driver_id = auth.uid());

-- bookings: passengers can only cancel their own bookings
DROP POLICY IF EXISTS "bookings_update_own" ON public.bookings;
CREATE POLICY "bookings_update_own"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (passenger_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.driver_id = auth.uid()
  ))
  WITH CHECK (passenger_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.driver_id = auth.uid()
  ));

-- messages/chat_messages: users can only send messages for their bookings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    DROP POLICY IF EXISTS "chat_messages_insert_own" ON public.chat_messages;
    CREATE POLICY "chat_messages_insert_own"
      ON public.chat_messages FOR INSERT TO authenticated
      WITH CHECK (sender_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id AND (b.passenger_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.rides r WHERE r.id = b.ride_id AND r.driver_id = auth.uid()
        ))
      ));
  END IF;
END $$;

-- notifications: users can only read their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- push_subscriptions: users can only manage their own subscriptions
DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- profiles: users can only update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- feedback: users can only see their own feedback (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedback') THEN
    DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
    CREATE POLICY "feedback_select_own"
      ON public.feedback FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- waiting_list: restrict update/delete (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waiting_list') THEN
    DROP POLICY IF EXISTS "waiting_list_no_update" ON public.waiting_list;
    CREATE POLICY "waiting_list_no_update"
      ON public.waiting_list FOR UPDATE TO authenticated
      USING (false);
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Helper function: is_admin(user_id)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Bootstrap: grant admin role to existing admin emails
--    Run this after setting up the app, or manage via admin dashboard
-- ──────────────────────────────────────────────────────────────────────────────

-- Example (uncomment and customize):
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE email = 'cristiermurache@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
