-- Andamùs Migration 038: Cascade Deletes and Referential Integrity
-- Path: supabase/migrations/038_cascade_deletes.sql

-- ============================================================
-- 1. REVIEWS TABLE — Drop & Recreate Foreign Key Constraints
-- ============================================================
ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey,
  DROP CONSTRAINT IF EXISTS reviews_reviewed_id_fkey;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewer_id_fkey 
    FOREIGN KEY (reviewer_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewed_id_fkey 
    FOREIGN KEY (reviewed_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- ============================================================
-- 2. SAFETY_REPORTS TABLE — Drop & Recreate Foreign Key Constraints
-- ============================================================
ALTER TABLE public.safety_reports 
  DROP CONSTRAINT IF EXISTS safety_reports_reporter_id_fkey,
  DROP CONSTRAINT IF EXISTS safety_reports_reported_id_fkey,
  DROP CONSTRAINT IF EXISTS safety_reports_ride_id_fkey;

ALTER TABLE public.safety_reports
  ADD CONSTRAINT safety_reports_reporter_id_fkey 
    FOREIGN KEY (reporter_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

ALTER TABLE public.safety_reports
  ADD CONSTRAINT safety_reports_reported_id_fkey 
    FOREIGN KEY (reported_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

ALTER TABLE public.safety_reports
  ADD CONSTRAINT safety_reports_ride_id_fkey 
    FOREIGN KEY (ride_id) 
    REFERENCES public.rides(id) 
    ON DELETE CASCADE;
