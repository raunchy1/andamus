-- Keep profiles.email in step with auth.users.email
-- ================================================
-- handle_new_user() runs only on INSERT into auth.users and stores
-- COALESCE(NEW.email, ''). For flows where Supabase populates the email in a
-- later UPDATE, the profile keeps the empty string for good — and every
-- transactional email (booking requests, confirmations, the weekly digest)
-- silently addresses nobody, because the app reads profiles.email, not
-- auth.users. One of the 14 live profiles was already in that state.

-- Backfill anything that drifted.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND u.email IS NOT NULL
  AND btrim(coalesce(p.email, '')) = '';

-- And keep it in step from here on.
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block an auth write because the mirror failed.
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();
