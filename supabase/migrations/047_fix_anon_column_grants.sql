-- Make the 046 revokes actually bite
-- ==================================
-- 046 tried to take private columns away from `anon` with
-- `REVOKE SELECT (col) ... FROM anon`, and to close the definer functions with
-- `REVOKE EXECUTE ... FROM anon, authenticated`. Neither had any effect:
--
--   * Column privileges are additive on top of the table privilege. `anon`
--     still held table-wide SELECT on `profiles`, which implies every column,
--     so revoking a per-column grant that was never the operative one changed
--     nothing. The table grant has to go first, then the safe columns are
--     granted back explicitly.
--
--   * A function's EXECUTE is granted to PUBLIC by default. Revoking it from
--     `anon` leaves the PUBLIC grant, which `anon` still inherits. The revoke
--     has to name PUBLIC.
--
-- Verified after applying: `GET /rest/v1/profiles?select=email` as anon now
-- returns 42501 instead of the address list.

-- ---------------------------------------------------------------------------
-- profiles: drop the blanket grant, hand back only the public columns
-- ---------------------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id,
  name,
  avatar_url,
  bio,
  slug,
  rating,
  review_count,
  rides_count,
  completed_rides_count,
  points,
  level,
  trust_score,
  locale,
  created_at,
  last_active_at,
  phone_verified,
  email_verified,
  id_verified,
  driver_verified,
  car_model,
  car_color,
  car_year,
  car_image_url,
  car_image_author,
  car_image_license
) ON public.profiles TO anon;

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER functions: revoke from PUBLIC, then re-grant deliberately
-- ---------------------------------------------------------------------------

-- Nothing in the app calls these; they were reachable at /rest/v1/rpc/*.
REVOKE ALL ON FUNCTION public.get_admin_stats()                       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_referral_bonus(uuid, text)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_referral_badges(uuid)             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_expired_seed_rides()            FROM PUBLIC, anon, authenticated;

-- Trigger functions: triggers fire independently of the caller's EXECUTE, so
-- nothing needs these reachable over RPC.
REVOKE ALL ON FUNCTION public.handle_new_user()                       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_last_active()                    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_group_member_count()             FROM PUBLIC, anon, authenticated;

-- Owner-checked in 046, but there is no reason for a signed-out caller to
-- reach it at all.
REVOKE ALL ON FUNCTION public.update_profile_slug(uuid, text)         FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_slug(uuid, text)      TO authenticated;

-- is_admin is called from the referral_attempts RLS policy, and policy
-- expressions are evaluated as the querying role, so `authenticated` needs it.
REVOKE ALL ON FUNCTION public.is_admin(uuid)                          FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid)                       TO authenticated;

-- search_locations powers the public location autocomplete and returns only
-- public place data; it deliberately stays open to anon.
