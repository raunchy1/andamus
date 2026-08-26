-- get_unread_notifications_count(user_uuid) is SECURITY DEFINER and takes the
-- user id as a plain argument, with no check that the caller is that user. It
-- is exposed over PostgREST as /rest/v1/rpc/get_unread_notifications_count, so
-- anyone — including `anon` — could pass any profile id and read how many
-- unread notifications that person has. Flagged by the Supabase linter as
-- 0028_anon_security_definer_function_executable.
--
-- Nothing in the application calls it: the bell counts unread rows straight
-- from `notifications`, under RLS. It survives only because it was created in
-- SETUP_DATABASE.sql. Rather than rewrite a function with no callers, close the
-- API surface.
--
-- EXECUTE is granted to PUBLIC by default, so revoking from anon/authenticated
-- alone would leave it callable through the PUBLIC grant.

REVOKE EXECUTE ON FUNCTION public.get_unread_notifications_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_unread_notifications_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_unread_notifications_count(uuid) FROM authenticated;
