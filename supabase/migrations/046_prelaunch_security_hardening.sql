-- Pre-launch security hardening
-- =============================
-- Four unrelated problems, all reachable from the public internet with nothing
-- but the anon key that ships in the browser bundle:
--
--   1. `profiles` is world-readable (RLS `USING (true)`) and holds email, phone,
--      car_plate and the Stripe ids. `GET /rest/v1/profiles?select=email,phone`
--      returned the whole user base to an anonymous caller.
--   2. The audit_log partitions never had RLS enabled, so they were not covered
--      by the parent table's admin-only policy.
--   3. Several SECURITY DEFINER functions take the acting user's id as a plain
--      argument and never check it against auth.uid(), while being callable by
--      `anon`. update_profile_slug let anyone rename any user's public URL.
--   4. Reporting materialized views were selectable by anon.
--
-- It also adds the two verification columns the application has always read but
-- which never made it into the database (see step 0).

-- ---------------------------------------------------------------------------
-- 0. Missing verification columns
-- ---------------------------------------------------------------------------
-- 003_create_verifications.sql declares all four verification flags, but only
-- phone_verified and id_verified exist in the database, so every read of
-- email_verified / driver_verified silently yielded undefined and
-- /api/admin/kyc's driver-licence approval failed with 42703 while still
-- telling the user they were verified.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill from the source of truth Supabase Auth already maintains.
UPDATE public.profiles p
SET email_verified = TRUE
FROM auth.users u
WHERE u.id = p.id
  AND u.email_confirmed_at IS NOT NULL
  AND p.email_verified IS DISTINCT FROM TRUE;

-- A driver licence is verified iff an approved verification row says so.
UPDATE public.profiles p
SET driver_verified = TRUE
WHERE EXISTS (
  SELECT 1 FROM public.verifications v
  WHERE v.user_id = p.id AND v.type = 'driver_license' AND v.status = 'approved'
) AND p.driver_verified IS DISTINCT FROM TRUE;

-- ---------------------------------------------------------------------------
-- 1. Stop anon from reading personal data out of `profiles`
-- ---------------------------------------------------------------------------
-- RLS is row-level, and the app genuinely needs anonymous visitors to read a
-- driver's name/avatar/rating for ride cards and public profiles. So the
-- filtering has to be per column: keep the row visible, take the private
-- columns away from `anon`. Signed-in users keep them (the app reads its own
-- profile client-side); `service_role` is unaffected and bypasses all of this.

REVOKE SELECT (
  email,
  phone,
  car_plate,
  birth_year,
  stripe_customer_id,
  stripe_connect_account_id,
  subscription_status,
  subscription_plan,
  subscription_period_end,
  cancellation_penalty_count,
  referral_code,
  referred_by,
  is_admin,
  is_blocked,
  blocked_at
) ON public.profiles FROM anon;

-- ---------------------------------------------------------------------------
-- 2. RLS on the audit_log partitions
-- ---------------------------------------------------------------------------
-- Partitions do not inherit the parent's row security; each needs it enabled
-- and its own policy. Mirrors the parent's "Admins can read audit log".

DO $$
DECLARE part_name TEXT;
BEGIN
  FOR part_name IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname LIKE 'audit_log_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                   part_name || '_admin_read', part_name);
    EXECUTE format($p$
      CREATE POLICY %I ON public.%I
        FOR SELECT TO authenticated
        USING (EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        ))
    $p$, part_name || '_admin_read', part_name);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. SECURITY DEFINER functions
-- ---------------------------------------------------------------------------
-- update_profile_slug and apply_referral_bonus trust a user id passed by the
-- caller. Check it against auth.uid() so the function is safe even if someone
-- re-grants EXECUTE later.

CREATE OR REPLACE FUNCTION public.update_profile_slug(p_user_id uuid, p_new_slug text)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  cleaned_slug TEXT;
BEGIN
  -- Only the owner may rename their own profile.
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN QUERY SELECT false, 'Not authorised';
    RETURN;
  END IF;

  cleaned_slug := lower(regexp_replace(p_new_slug, '[^a-z0-9-]+', '-', 'g'));
  cleaned_slug := trim(both '-' from cleaned_slug);

  IF length(cleaned_slug) < 2 THEN
    RETURN QUERY SELECT false, 'Slug too short (min 2 chars)';
    RETURN;
  END IF;

  IF length(cleaned_slug) > 30 THEN
    cleaned_slug := left(cleaned_slug, 30);
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE slug = cleaned_slug AND id != p_user_id) THEN
    RETURN QUERY SELECT false, 'Slug already taken';
    RETURN;
  END IF;

  UPDATE profiles SET slug = cleaned_slug WHERE id = p_user_id;

  RETURN QUERY SELECT true, cleaned_slug;
END;
$function$;

-- Revoke EXECUTE from the public-facing roles on the definer functions the
-- client never calls. Trigger functions still fire: a trigger runs regardless
-- of the invoking role's EXECUTE privilege.
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_slug(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_referral_bonus(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_referral_badges(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_expired_seed_rides() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_last_active() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_group_member_count() FROM anon, authenticated;
-- is_admin stays executable by `authenticated`: the referral_attempts policy
-- calls it, and policy expressions run as the querying role.
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;

-- ---------------------------------------------------------------------------
-- 4. Reporting views are for the server, not the browser
-- ---------------------------------------------------------------------------
-- Only lib/server/cache/warmers.ts reads these, using the service role.
REVOKE SELECT ON public.mv_popular_routes      FROM anon, authenticated;
REVOKE SELECT ON public.mv_driver_leaderboard  FROM anon, authenticated;
REVOKE SELECT ON public.mv_daily_ride_stats    FROM anon, authenticated;
REVOKE SELECT ON public.mv_daily_booking_stats FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Pin search_path on the remaining SECURITY DEFINER / trigger functions
-- ---------------------------------------------------------------------------
-- A mutable search_path lets a caller who can create objects shadow an
-- unqualified name inside the function body.
DO $$
DECLARE fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) AS c
        WHERE c LIKE 'search_path=%'
      )
      -- Skip functions owned by an extension (pg_trgm et al): they belong to
      -- the extension owner and are not ours to alter.
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid AND d.classid = 'pg_proc'::regclass AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.sig);
  END LOOP;
END $$;
