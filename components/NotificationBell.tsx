"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Bell,
  Check,
  Car,
  MessageCircle,
  Star,
  X,
  CheckCheck,
  Loader2,
  BellRing,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "booking_request" | "booking_accepted" | "booking_rejected" | "new_message" | "new_review" | "ride_alert";
  title: string;
  body: string;
  read: boolean;
  ride_id: string | null;
  booking_id: string | null;
  created_at: string;
}

interface NotificationBellProps {
  isHome?: boolean;
}

const notificationIcons = {
  booking_request: Car,
  booking_accepted: Check,
  booking_rejected: X,
  new_message: MessageCircle,
  new_review: Star,
  ride_alert: BellRing,
};

const notificationColors = {
  booking_request: "bg-blue-500/20 text-blue-400",
  booking_accepted: "bg-green-500/20 text-green-400",
  booking_rejected: "bg-bad/20 text-bad",
  new_message: "bg-purple-500/20 text-purple-400",
  new_review: "bg-yellow-500/20 text-yellow-400",
  ride_alert: "bg-orange-500/20 text-orange-400",
};

function timeAgo(date: string, t: (key: string, values?: Record<string, string | number>) => string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 60) {
    return t("justNow");
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return t("minutesAgo", { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t("hoursAgo", { count: hours });
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return t("daysAgo", { count: days });
  }
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function NotificationBell({ isHome = false }: NotificationBellProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient()).current;
  const processedIds = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const markAllInFlight = useRef(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user || !isMountedRef.current) return;

      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (notifs && isMountedRef.current) {
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: { read: boolean }) => !n.read).length);
        // Sync processed ids to avoid duplicates on realtime
        processedIds.current = new Set(notifs.map((n: Notification) => n.id));
      }
    } catch (err) {
      console.error("[notifications] fetch error:", err);
    }
  }, [supabase]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchNotifications();
    return () => { isMountedRef.current = false; };
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;

        channel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload: import("@supabase/supabase-js").RealtimePostgresInsertPayload<Record<string, unknown>>) => {
              const newNotif = payload.new as unknown as Notification;
              // Deduplication: ignore if already processed
              if (processedIds.current.has(newNotif.id)) return;
              processedIds.current.add(newNotif.id);

              setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
              setUnreadCount((prev) => prev + 1);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload: import("@supabase/supabase-js").RealtimePostgresUpdatePayload<Record<string, unknown>>) => {
              const updated = payload.new as unknown as Notification;
              setNotifications((prev) => {
                const updatedList = prev.map((n) => (n.id === updated.id ? updated : n));
                setUnreadCount(updatedList.filter((n) => !n.read).length);
                return updatedList;
              });
            }
          )
          .subscribe();
      } catch (err) {
        console.error("[notifications] subscription setup error:", err);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      isMountedRef.current = false;
    };
  }, [supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (markAllInFlight.current) return;
    markAllInFlight.current = true;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (!error && isMountedRef.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success(t("allNotificationsRead"));
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
      markAllInFlight.current = false;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.booking_id) {
      if (
        notification.type === "new_message" ||
        notification.type === "booking_accepted" ||
        notification.type === "booking_rejected"
      ) {
        return `/${locale}/chat/${notification.booking_id}`;
      }
      return `/${locale}/profilo`;
    }
    if (notification.ride_id) {
      return `/${locale}/corsa/${notification.ride_id}`;
    }
    return `/${locale}/profilo`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          const willOpen = !isOpen;
          setIsOpen(willOpen);
          if (willOpen) {
            setDropdownLoading(true);
            fetchNotifications().finally(() => setDropdownLoading(false));
          }
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label={t("notifications")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#4FB3C9] text-[10px] font-bold text-white ring-2 ring-[#0a0a0a]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-white/10 bg-elevated shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="font-semibold text-white">{t("notifications")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-[#4FB3C9] hover:text-white transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                {t("markAll")}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {dropdownLoading ? (
              <div className="px-4 py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 text-white/30 animate-spin" />
                <p className="mt-2 text-sm text-white/50">{t("loading")}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-white/20" />
                <p className="mt-2 text-sm text-white/50">{t("noNotifications")}</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                return (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/5 ${
                      !notification.read ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notificationColors[notification.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="text-sm text-white/60 line-clamp-2">{notification.body}</p>
                      <p className="mt-1 text-xs text-white/40">{timeAgo(notification.created_at, t)}</p>
                    </div>
                    {!notification.read && (
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#4FB3C9]" />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2 text-center">
              <Link
                href={`/${locale}/profilo`}
                onClick={() => setIsOpen(false)}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                {t("seeAll")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
