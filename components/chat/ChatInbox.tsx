"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ChatList, type ChatConversation } from "@/components/chat/ChatList";
import { PageHeader } from "@/components/PageHeader";

export function ChatInbox() {
  const t = useTranslations("chat");
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // A conversation belongs to a booking, and a booking has two sides. The
      // inbox used to query passenger_id only, so a driver — who has the other
      // half of every conversation — saw an empty list. Fetch both roles.
      // `bookings` has two FKs to profiles (passenger_id and cancelled_by), so
      // the passenger embed has to name its constraint.
      const [asPassenger, asDriver] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            `
            id,
            status,
            updated_at,
            rides!inner(from_city, to_city, driver_id, profiles(name, avatar_url))
          `
          )
          .eq("passenger_id", user.id)
          .neq("status", "cancelled")
          .order("updated_at", { ascending: false }),
        supabase
          .from("bookings")
          .select(
            `
            id,
            status,
            updated_at,
            passenger:profiles!bookings_passenger_id_fkey(name, avatar_url),
            rides!inner(from_city, to_city, driver_id)
          `
          )
          .eq("rides.driver_id", user.id)
          .neq("status", "cancelled")
          .order("updated_at", { ascending: false }),
      ]);

      type Party = { name: string; avatar_url: string | null };
      const one = <T,>(v: T | T[] | null | undefined): T | undefined =>
        Array.isArray(v) ? v[0] : (v ?? undefined);

      type Row = {
        id: string;
        updated_at: string;
        passenger?: Party | Party[] | null;
        rides?:
          | { from_city: string; to_city: string; profiles?: Party | Party[] | null }
          | { from_city: string; to_city: string; profiles?: Party | Party[] | null }[]
          | null;
      };

      // The other party is the driver when you booked, the passenger when you drove.
      const collected = new Map<string, { row: Row; other?: Party }>();
      for (const row of (asPassenger.data ?? []) as Row[]) {
        const ride = one(row.rides);
        collected.set(row.id, { row, other: one(ride?.profiles) });
      }
      for (const row of (asDriver.data ?? []) as Row[]) {
        if (collected.has(row.id)) continue;
        collected.set(row.id, { row, other: one(row.passenger) });
      }

      const bookings = [...collected.values()].sort(
        (a, b) =>
          new Date(b.row.updated_at).getTime() - new Date(a.row.updated_at).getTime()
      );

      if (bookings.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // ultimo messaggio per ogni conversazione — una sola query, niente N+1
      const bookingIds = bookings.map((b) => b.row.id);
      const { data: messages } = await supabase
        .from("messages")
        .select("booking_id, content, created_at")
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: false });

      const lastMessageByBooking = new Map<string, string>();
      for (const m of messages ?? []) {
        if (!lastMessageByBooking.has(m.booking_id)) {
          lastMessageByBooking.set(m.booking_id, m.content);
        }
      }

      const items: ChatConversation[] = bookings.map(({ row, other }) => {
        const ride = one(row.rides);
        return {
          bookingId: row.id,
          participantName: other?.name || t("user"),
          participantAvatar: other?.avatar_url || null,
          route: `${ride?.from_city || ""} → ${ride?.to_city || ""}`,
          preview: lastMessageByBooking.get(row.id) ?? "",
          timestamp: row.updated_at,
          unreadCount: 0,
        };
      });

      setConversations(items);
      setLoading(false);
    };

    load();
  }, [supabase, t]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-bg">
        <Loader2 className="size-8 animate-spin text-accent" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl bg-bg">
      <PageHeader eyebrow={t("inboxEyebrow")} title={t("inboxTitle")} />
      <ChatList conversations={conversations} />
    </div>
  );
}