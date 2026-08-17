"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ChatConversation {
  bookingId: string;
  participantName: string;
  participantAvatar: string | null;
  /** Tratta del viaggio, es. "Cagliari → Olbia" */
  route?: string;
  /** Ultimo messaggio scambiato */
  preview: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface ChatListProps {
  conversations: ChatConversation[];
  className?: string;
}

function formatListTime(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString(locale === "it" ? "it-IT" : locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(locale === "it" ? "it-IT" : locale, {
    day: "numeric",
    month: "short",
  });
}

export function ChatList({ conversations, className }: ChatListProps) {
  const t = useTranslations("chat");
  const locale = useLocale();

  if (conversations.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center px-6 py-16 text-center",
          className
        )}
      >
        <div className="mb-4 flex size-14 items-center justify-center rounded-[var(--radius)] border border-line bg-surface">
          <MessageSquare className="size-6 text-muted" strokeWidth={1.5} />
        </div>
        <p className="heading-editorial text-lg text-fg">{t("noConversations")}</p>
        <p className="mt-2 max-w-xs text-sm text-muted">{t("startConversation")}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {conversations.map((conversation) => (
        <Link
          key={conversation.bookingId}
          href={`/${locale}/chat/${conversation.bookingId}`}
          className="chat-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 22px",
            transition: "background .15s",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              src={conversation.participantAvatar}
              name={conversation.participantName}
              size="md"
              className="size-12"
            />
            {conversation.isOnline && (
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "var(--green)",
                  border: "2px solid var(--sand)",
                }}
              />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {conversation.participantName}
              </p>
              <span style={{ flexShrink: 0, fontSize: 12.5, color: "var(--faint)" }}>
                {formatListTime(conversation.timestamp, locale)}
              </span>
            </div>

            {conversation.route && (
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--green)",
                  margin: "2px 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {conversation.route}
              </p>
            )}

            {conversation.preview && (
              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  margin: "2px 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {conversation.preview}
              </p>
            )}
          </div>

          {conversation.unreadCount && conversation.unreadCount > 0 ? (
            <span
              style={{
                display: "flex",
                width: 20,
                height: 20,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "var(--green)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          ) : null}
        </Link>
      ))}

      <style jsx>{`
        .chat-row:hover {
          background: var(--sand-deep);
        }
      `}</style>
    </div>
  );
}