"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  Bell, 
  Check, 
  Car, 
  MessageCircle, 
  Star, 
  X,
  CheckCheck,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'new_message' | 'new_review';
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
};

const notificationColors = {
  booking_request: "bg-blue-500/20 text-blue-400",
  booking_accepted: "bg-green-500/20 text-green-400",
  booking_rejected: "bg-red-500/20 text-red-400",
  new_message: "bg-purple-500/20 text-purple-400",
  new_review: "bg-yellow-500/20 text-yellow-400",
};

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return "Adesso";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g fa`;
  return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export function NotificationBell({ isHome = false }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  }, [supabase]);

  // Initial fetch
  useEffect(() => {
    setTimeout(() => fetchNotifications(), 0);
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 10));
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
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
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("Tutte le notifiche lette");
    }
    setLoading(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.booking_id) {
      if (notification.type === 'new_message') {
        return `/chat/${notification.booking_id}`;
      }
      return `/profilo`;
    }
    if (notification.ride_id) {
      return `/corsa/${notification.ride_id}`;
    }
    return '/profilo';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          isHome 
            ? "text-white/70 hover:bg-white/10 hover:text-white" 
            : "text-gray-500 hover:bg-gray-100 hover:text-[#1a1a2e]"
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#e63946] text-[10px] font-bold text-white ring-2 ring-[#1a1a2e]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-white/10 bg-[#1e2a4a] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="font-semibold text-white">Notifiche</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-[#e63946] hover:text-white transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Segna tutte
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-white/20" />
                <p className="mt-2 text-sm text-white/50">Nessuna notifica</p>
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
                      <p className="mt-1 text-xs text-white/40">{timeAgo(notification.created_at)}</p>
                    </div>
                    {!notification.read && (
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#e63946]" />
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
                href="/profilo"
                onClick={() => setIsOpen(false)}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                Vedi tutte le notifiche
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
