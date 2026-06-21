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
    <div className={cn("divide-y divide-line", className)}>
      {conversations.map((conversation) => (
        <div key={conversation.bookingId}>
          <Link
            href={`/${locale}/chat/${conversation.bookingId}`}
            className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-2/60 sm:px-6"
          >
            <div className="relative shrink-0">
              <Avatar
                src={conversation.participantAvatar}
                name={conversation.participantName}
                size="md"
              />
              {conversation.isOnline && (
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-bg bg-accent" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold text-fg">
                  {conversation.participantName}
                </p>
                <span className="shrink-0 font-mono text-[11px] text-dim">
                  {formatListTime(conversation.timestamp, locale)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted">{conversation.preview}</p>
            </div>

            {conversation.unreadCount && conversation.unreadCount > 0 ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-medium text-accent-fg">
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            ) : null}
          </Link>
        </div>
      ))}
    </div>
  );
}