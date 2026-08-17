"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Check,
  Car,
  MessageCircle,
  Star,
  X,
  BellRing,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NotificationType =
  | "booking_request"
  | "booking_accepted"
  | "booking_rejected"
  | "new_message"
  | "new_review"
  | "ride_alert";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  ride_id: string | null;
  booking_id: string | null;
  created_at: string;
}

const icons: Record<NotificationType, typeof Car> = {
  booking_request: Car,
  booking_accepted: Check,
  booking_rejected: X,
  new_message: MessageCircle,
  new_review: Star,
  ride_alert: BellRing,
};

/** Colore dell'icona per tipo — verde per conferme, terracotta per rifiuti. */
const iconBackgrounds: Record<NotificationType, string> = {
  booking_request: "var(--sand-deep)",
  booking_accepted: "var(--green)",
  booking_rejected: "var(--terracotta)",
  new_message: "var(--green)",
  new_review: "var(--sand-deep)",
  ride_alert: "var(--sand-deep)",
};

const iconColors: Record<NotificationType, string> = {
  booking_request: "var(--ink)",
  booking_accepted: "#FFFFFF",
  booking_rejected: "#FFFFFF",
  new_message: "#FFFFFF",
  new_review: "var(--ink)",
  ride_alert: "var(--ink)",
};

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "adesso";
  if (mins < 60) return `${mins} min fa`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "ora" : "ore"} fa`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "ieri";
  if (days < 7) return `${days} giorni fa`;

  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}

function linkFor(locale: string, n: Notification): string | null {
  if (n.booking_id) return `/${locale}/chat/${n.booking_id}`;
  if (n.ride_id) return `/${locale}/corsa/${n.ride_id}`;
  return null;
}

interface NotificationsClientProps {
  locale: string;
  initialNotifications: Notification[];
}

export function NotificationsClient({
  locale,
  initialNotifications,
}: NotificationsClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [supabase] = useState(() => createClient());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
  };

  const markOneRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  return (
    <div style={{ background: "var(--sand)", minHeight: "100dvh" }} className="pb-12">
      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ padding: "60px 22px 18px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Indietro"
          >
            <ChevronLeft size={20} strokeWidth={1.7} style={{ color: "var(--ink)" }} />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              style={{
                background: "transparent",
                border: 0,
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--green)",
                cursor: "pointer",
              }}
            >
              Segna tutte come lette
            </button>
          )}
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.8px",
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Notifiche
        </h1>
      </header>

      {/* ── Lista ──────────────────────────────────────── */}
      {notifications.length === 0 ? (
        <div style={{ padding: "60px 32px", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "var(--sand-deep)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Bell size={24} strokeWidth={1.7} style={{ color: "var(--muted)" }} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", margin: "0 0 6px" }}>
            Nessuna notifica
          </p>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
            Ti avviseremo quando succede qualcosa.
          </p>
        </div>
      ) : (
        <div>
          {notifications.map((n) => {
            const Icon = icons[n.type] ?? BellRing;
            const href = linkFor(locale, n);

            const row = (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 22px",
                  background: n.read ? "transparent" : "var(--sand-deep)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: iconBackgrounds[n.type] ?? "var(--sand-deep)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.9}
                    color={iconColors[n.type] ?? "var(--ink)"}
                  />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--ink)",
                      margin: "0 0 2px",
                    }}
                  >
                    {n.title}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--muted)",
                      margin: "0 0 4px",
                      lineHeight: 1.4,
                      textWrap: "pretty",
                    }}
                  >
                    {n.body}
                  </p>
                  <span style={{ fontSize: 12.5, color: "var(--faint)" }}>
                    {relativeTime(n.created_at)}
                  </span>
                </div>
              </div>
            );

            return href ? (
              <Link key={n.id} href={href} onClick={() => markOneRead(n.id)}>
                {row}
              </Link>
            ) : (
              <button
                key={n.id}
                type="button"
                onClick={() => markOneRead(n.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                {row}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
