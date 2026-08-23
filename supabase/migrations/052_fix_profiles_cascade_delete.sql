-- Account deletion (GDPR "right to be forgotten", /api/profile/delete) calls
-- auth.admin.deleteUser(), which deletes the row from auth.users directly.
-- profiles_id_fkey had no ON DELETE action, so that delete was rejected with
-- a foreign key violation for every user that has a profile row — i.e.
-- every real signed-up user. Migration 038 cascaded everything that hangs
-- off public.profiles, but missed the top of the chain: auth.users itself.
ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
