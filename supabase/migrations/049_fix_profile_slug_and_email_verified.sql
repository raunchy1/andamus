-- Fix mangled profile slugs, and email_verified on signup
-- =======================================================
-- generate_profile_slug() applied lower() *after* the character filter:
--
--   lower(regexp_replace(p_name, '[^a-z0-9]+', '-', 'g'))
--
-- `[^a-z0-9]` matches uppercase letters, so the first letter of every
-- capitalised word was replaced by a hyphen before lower() ever ran:
-- "Cristian Ermurache" became "-ristian-rmurache", trimmed to
-- "ristian-rmurache". 14 of the 16 live profiles carried a mangled slug, and
-- the slug is the public profile URL (/u/<slug>) and the share link.
--
-- handle_new_user() also never set email_verified, so every account created
-- through Google — whose address Supabase marks confirmed straight away —
-- started life as unverified, dropping the trust score and hiding the badge.

-- ---------------------------------------------------------------------------
-- 1. Lower-case first, then filter
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_profile_slug(p_name text, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  base_slug := regexp_replace(lower(coalesce(p_name, 'user')), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  IF length(base_slug) < 2 THEN
    base_slug := 'user';
  END IF;

  base_slug := left(base_slug, 30);
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != p_user_id) LOOP
    counter := counter + 1;
    IF counter > max_attempts THEN
      final_slug := base_slug || '-' || left(p_user_id::text, 8);
      EXIT;
    END IF;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$function$;

-- update_profile_slug() (the user-facing rename) had the same ordering, but
-- there the input is already lower-cased by the caller's regex; normalise it
-- the same way so both paths agree.
CREATE OR REPLACE FUNCTION public.update_profile_slug(p_user_id uuid, p_new_slug text)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  cleaned_slug TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN QUERY SELECT false, 'Not authorised';
    RETURN;
  END IF;

  cleaned_slug := regexp_replace(lower(coalesce(p_new_slug, '')), '[^a-z0-9]+', '-', 'g');
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

-- ---------------------------------------------------------------------------
-- 2. Rebuild the existing slugs
-- ---------------------------------------------------------------------------
-- Oldest account keeps the bare slug; later namesakes get -1, -2, …
WITH candidate AS (
  SELECT
    id,
    created_at,
    CASE
      WHEN length(trim(both '-' from regexp_replace(lower(coalesce(name, 'user')), '[^a-z0-9]+', '-', 'g'))) < 2
      THEN 'user'
      ELSE left(trim(both '-' from regexp_replace(lower(coalesce(name, 'user')), '[^a-z0-9]+', '-', 'g')), 30)
    END AS base
  FROM public.profiles
), ranked AS (
  SELECT id, base,
         row_number() OVER (PARTITION BY base ORDER BY created_at NULLS LAST, id) AS rn
  FROM candidate
)
UPDATE public.profiles p
SET slug = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || '-' || (r.rn - 1) END
FROM ranked r
WHERE p.id = r.id
  AND p.slug IS DISTINCT FROM (CASE WHEN r.rn = 1 THEN r.base ELSE r.base || '-' || (r.rn - 1) END);

-- ---------------------------------------------------------------------------
-- 3. Carry the confirmed-email flag onto the profile at signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO profiles (
    id, name, email, avatar_url, referral_code,
    rating, rides_count, points, level, slug, email_verified
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'avatar_url',
    generate_referral_code(),
    5.0, 0, 0, 'Viaggiatore',
    generate_profile_slug(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.id),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Keep email_verified in step when Supabase confirms an address later.
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.profiles
  SET email = COALESCE(NEW.email, email),
      email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- Backfill the flag for everyone already confirmed.
UPDATE public.profiles p
SET email_verified = TRUE
FROM auth.users u
WHERE u.id = p.id AND u.email_confirmed_at IS NOT NULL AND p.email_verified IS DISTINCT FROM TRUE;
