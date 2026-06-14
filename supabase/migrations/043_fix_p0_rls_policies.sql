-- ============================================================
-- MIGRATION 043: P0 RLS Fixes (idempotent)
-- ============================================================
-- Ensures drivers can read chat messages and update booking status.
-- Safe to re-run; consolidates policies from migrations 025 and 032.
-- ============================================================

-- 1. MESSAGES — drivers can read messages for their rides
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    DROP POLICY IF EXISTS "Users can view messages in their bookings" ON public.messages;

    CREATE POLICY "Users can view messages in their bookings"
      ON public.messages FOR SELECT
      TO authenticated
      USING (
        auth.uid() = sender_id
        OR auth.uid() = (
          SELECT b.passenger_id FROM public.bookings b WHERE b.id = booking_id
        )
        OR auth.uid() = (
          SELECT r.driver_id
          FROM public.bookings b
          JOIN public.rides r ON r.id = b.ride_id
          WHERE b.id = booking_id
        )
      );
  END IF;
END $$;

-- 2. BOOKINGS — passengers and drivers can update booking status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) THEN
    DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Passengers can update their own bookings" ON public.bookings;
    DROP POLICY IF EXISTS "Drivers can update bookings for their rides" ON public.bookings;
    DROP POLICY IF EXISTS "bookings_update_own" ON public.bookings;

    CREATE POLICY "bookings_update_participant"
      ON public.bookings FOR UPDATE
      TO authenticated
      USING (
        auth.uid() = passenger_id
        OR auth.uid() = (SELECT driver_id FROM public.rides WHERE id = ride_id)
      )
      WITH CHECK (
        auth.uid() = passenger_id
        OR auth.uid() = (SELECT driver_id FROM public.rides WHERE id = ride_id)
      );
  END IF;
END $$;