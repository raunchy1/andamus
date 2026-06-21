"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ChatList, type ChatConversation } from "@/components/chat/ChatList";

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

      const { data: bookings } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          updated_at,
          rides(from_city, to_city, profiles(name, avatar_url))
        `
        )
        .eq("passenger_id", user.id)
        .neq("status", "cancelled")
        .order("updated_at", { ascending: false });

      if (!bookings) {
        setLoading(false);
        return;
      }

      const items: ChatConversation[] = bookings.map((booking: {
        id: string;
        updated_at: string;
        rides: {
          from_city: string;
          to_city: string;
          profiles: { name: string; avatar_url: string | null } | { name: string; avatar_url: string | null }[];
        } | {
          from_city: string;
          to_city: string;
          profiles: { name: string; avatar_url: string | null } | { name: string; avatar_url: string | null }[];
        }[];
      }) => {
        const ride = Array.isArray(booking.rides) ? booking.rides[0] : booking.rides;
        const driver = Array.isArray(ride?.profiles) ? ride.profiles[0] : ride?.profiles;

        return {
          bookingId: booking.id,
          participantName: driver?.name || t("user"),
          participantAvatar: driver?.avatar_url || null,
          preview: `${ride?.from_city || ""} → ${ride?.to_city || ""}`,
          timestamp: booking.updated_at,
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
      <header className="border-b border-line px-4 py-6 sm:px-6">
        <p className="text-eyebrow">{t("inboxEyebrow")}</p>
        <h1 className="heading-editorial text-2xl text-fg">{t("inboxTitle")}</h1>
      </header>
      <ChatList conversations={conversations} />
    </div>
  );
}