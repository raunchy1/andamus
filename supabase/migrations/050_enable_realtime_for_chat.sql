-- Turn on Realtime for the tables the app subscribes to
-- ====================================================
-- ChatWindow and NotificationBell open postgres_changes channels on
-- public.messages and public.notifications, but the `supabase_realtime`
-- publication — the one Realtime actually reads — contained only
-- `waiting_list`. No INSERT event was ever emitted, so a chat message only
-- appeared after a full page reload, including for the person who sent it,
-- and the notification bell never lit up on its own.
--
-- (`messages` did appear in `supabase_realtime_messages_publication`, which is
-- Realtime's own internal publication for Broadcast — unrelated to
-- postgres_changes on application tables. Easy to mistake for the real thing.)
--
-- Deliberately NOT added: public.profiles. postgres_changes evaluates RLS to
-- decide who receives a row, but the payload carries every column of that row
-- and does not honour column-level grants. profiles is world-readable by
-- policy and holds email, phone and the Stripe ids, so publishing it would
-- hand every authenticated subscriber the PII that 047 just took away from
-- anon. The admin dashboard's live profile counter is not worth that.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'messages'
      AND c.relnamespace = 'public'::regnamespace
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'notifications'
      AND c.relnamespace = 'public'::regnamespace
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Realtime needs the full old row to evaluate RLS on UPDATE/DELETE.
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
