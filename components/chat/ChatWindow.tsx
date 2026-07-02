"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markMessagesAsRead } from "@/lib/chat-actions";
import { staticMapDarkStyleQuery } from "@/lib/sardinia-cities";
import {
  Loader2,
  X,
  Mic,
  Play,
  Pause,
  MapPin,
  Plus,
  Send,
  Check,
  CheckCheck,
  RotateCcw,
  WifiOff,
  ChevronLeft,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { notifyNewMessage } from "@/lib/notification-actions";
import { useDeviceType } from "@/components/view-mode";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProductAnalytics } from "@/lib/posthog";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ============================================================
// TYPES
// ============================================================
interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "location" | "audio";
  media_url?: string;
  location_lat?: number;
  location_lng?: number;
  duration?: number;
  read: boolean;
  created_at: string;
  sender?: {
    name: string;
    avatar_url: string | null;
  };
}

interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
  rides: {
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    driver_id: string;
    profiles: {
      name: string;
      avatar_url: string | null;
    };
  };
  passenger: {
    name: string;
    avatar_url: string | null;
  };
}

interface ChatWindowProps {
  bookingId: string;
  booking: Booking;
  user: SupabaseUser;
}

type LocalMessage = Message & {
  status: "pending" | "failed";
  tempId: string;
};

type DisplayMessage = Message | LocalMessage;

// ============================================================
// UTILITIES
// ============================================================
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function isMyMessage(senderId: string, currentUserId: string) {
  return senderId === currentUserId;
}

// ============================================================
// SUB-COMPONENT: ReadIndicator
// ============================================================
const ReadIndicator = memo(function ReadIndicator({
  message,
  currentUserId,
}: {
  message: Message;
  currentUserId: string;
}) {
  const t = useTranslations("chat");
  if (!isMyMessage(message.sender_id, currentUserId)) return null;
  return (
    <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-dim">
      {message.read ? (
        <>
          <CheckCheck className="size-3" strokeWidth={1.5} />
          {t("read")}
        </>
      ) : (
        <>
          <Check className="size-3" strokeWidth={1.5} />
          {t("sent")}
        </>
      )}
    </span>
  );
});

// ============================================================
// SUB-COMPONENT: MessageBubble
// ============================================================
const MessageBubble = memo(function MessageBubble({
  message,
  currentUserId,
  playingAudio,
  onToggleAudio,
  onZoomImage,
  onRetry,
  retryingId,
}: {
  message: DisplayMessage;
  currentUserId: string;
  playingAudio: string | null;
  onToggleAudio: (url: string) => void;
  onZoomImage: (url: string) => void;
  onRetry: (tempId: string) => void;
  retryingId: string | null;
}) {
  const t = useTranslations("chat");
  const mine = isMyMessage(message.sender_id, currentUserId);
  const isLocal = "status" in message;
  const isPending = isLocal && message.status === "pending";
  const isFailed = isLocal && message.status === "failed";

  return (
    <div
      className={`flex flex-col ${
        mine ? "items-end self-end" : "items-start"
      } max-w-[85%] gap-1`}
    >
      <div
        className={`relative rounded-[var(--radius-sm)] p-3.5 text-base leading-relaxed text-fg ${
          mine
            ? "bg-surface-2"
            : "border border-line bg-surface"
        } ${isPending ? "opacity-70" : ""} ${isFailed ? "border-bad/40 bg-bad/10" : ""}`}
      >
        {/* Pending overlay */}
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Failed overlay */}
        {isFailed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 rounded-xl">
            <button
              onClick={() => onRetry(message.tempId)}
              disabled={retryingId === message.tempId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bad text-bad-foreground text-xs font-bold hover:bg-bad/90 transition-colors disabled:opacity-50"
            >
              {retryingId === message.tempId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {t("retry")}
            </button>
          </div>
        )}

        {message.type === "image" && message.media_url && (
          <div className="mb-2">
            <Image
              src={message.media_url}
              alt={t("sharedImageAlt")}
              width={400}
              height={300}
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() =>
                !isPending && !isFailed && onZoomImage(message.media_url!)
              }
            />
          </div>
        )}

        {message.type === "location" &&
          message.location_lat &&
          message.location_lng && (
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs uppercase tracking-tight text-primary">
                    {t("sharedLocation")}
                  </span>
                  <span className="text-[10px] text-primary/70">
                    Lat: {message.location_lat.toFixed(4)}
                  </span>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${message.location_lat},${message.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-elevated relative">
                    <Image
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.location_lat},${message.location_lng}&zoom=15&size=300x150&${staticMapDarkStyleQuery}&markers=color:0x4FB3C9%7C${message.location_lat},${message.location_lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                      alt={t("locationMapAlt")}
                      fill
                      className="object-cover grayscale opacity-60"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-elevated flex items-center justify-center">
                    <div className="text-center text-muted">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-xs">{t("sharedLocation")}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                  <MapPin className="w-4 h-4" />
                  <span>{t("openInGoogleMaps")}</span>
                </div>
              </a>
            </div>
          )}

        {message.type === "audio" && message.media_url && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleAudio(message.media_url!)}
              disabled={isPending || isFailed}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-accent-fg disabled:opacity-50"
            >
              {playingAudio === message.media_url ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <div className="flex items-end gap-[2px] h-8">
              {[2, 4, 6, 3, 5, 8, 4, 6, 3, 5, 2, 7, 4, 5].map((h, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ height: `${h * 3}px` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-primary">
              {formatDuration(message.duration || 0)}
            </span>
          </div>
        )}

        {message.content && message.type === "text" && (
          <p className="text-fg">{message.content}</p>
        )}
        {message.content && message.type !== "text" && (
          <p className="mt-2 text-xs text-muted">{message.content}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-1">
        <span className="font-mono text-[11px] text-dim">
          {formatTime(message.created_at)}
        </span>
        {!isLocal && <ReadIndicator message={message as Message} currentUserId={currentUserId} />}
        {isPending && (
          <span className="text-[9px] font-medium text-primary/60">
            {t("sending")}
          </span>
        )}
        {isFailed && (
          <span className="text-[9px] font-medium text-bad/80">
            {t("failed")}
          </span>
        )}
      </div>
    </div>
  );
});

// ============================================================
// SUB-COMPONENT: ChatInput
// ============================================================
const ChatInput = memo(function ChatInput({
  isRecording,
  recordingTime,
  newMessage,
  onNewMessageChange,
  onSend,
  sending,
  uploadingImage,
  onImageSelect,
  onSendLocation,
  onStartRecording,
  onStopRecording,
  mobile = false,
  isOnline = true,
}: {
  isRecording: boolean;
  recordingTime: number;
  newMessage: string;
  onNewMessageChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  uploadingImage: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendLocation: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  mobile?: boolean;
  isOnline?: boolean;
}) {
  const t = useTranslations("chat");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClasses =
    "flex-1 border-none bg-transparent text-base text-fg placeholder:text-dim focus:outline-none focus:ring-0 disabled:opacity-50";

  const containerClasses = mobile
    ? "flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2.5"
    : "flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 py-3";

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") onSend();
    },
    [onSend]
  );

  return (
    <>
      {isRecording && (
        <div
          className={`mb-3 flex items-center justify-between bg-bad/10 border border-bad/20 rounded-full px-4 py-2 text-sm truncate ${
            mobile ? "" : "mb-4 px-5 py-3"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-bad animate-pulse" />
            <span className="text-bad text-sm font-medium">
              {t("recording")}
            </span>
          </div>
          <span className="text-bad font-mono text-sm">
            {formatDuration(recordingTime)}
          </span>
        </div>
      )}

      <div className={containerClasses}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording || uploadingImage}
          className="text-muted transition-colors hover:text-accent disabled:opacity-50"
        >
          <Plus className="size-5" strokeWidth={1.5} />
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => onNewMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording ? t("recording") : t("messagePlaceholder")
          }
          disabled={isRecording}
          className={inputClasses}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSendLocation}
            disabled={isRecording || sending}
            className="text-muted transition-colors hover:text-accent disabled:opacity-50"
          >
            <MapPin className="size-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onMouseDown={onStartRecording}
            onMouseUp={onStopRecording}
            onTouchStart={onStartRecording}
            onTouchEnd={onStopRecording}
            onMouseLeave={isRecording ? onStopRecording : undefined}
            disabled={!!newMessage.trim() || sending}
            className={`text-muted transition-colors hover:text-accent disabled:opacity-0 ${
              isRecording ? "text-bad" : ""
            }`}
          >
            <Mic className="size-5" strokeWidth={1.5} />
          </button>
          <button
            onClick={onSend}
            disabled={sending || !newMessage.trim() || isRecording}
            className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-accent transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Send className="size-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>
    </>
  );
});

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ChatWindow({
  bookingId,
  booking,
  user,
}: ChatWindowProps) {
  const [supabase] = useState(() => createClient());
  const deviceType = useDeviceType();
  const t = useTranslations("chat");
  const locale = useLocale();
  const searchParams = useSearchParams();

  // Show payment success toast on redirect from Stripe
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success(t("paymentSuccess") || "Pagamento completato! La tua prenotazione è confermata.");
      // Clean the URL
      window.history.replaceState({}, "", `/${locale}/chat/${bookingId}`);
    }
  }, [searchParams, bookingId, locale, t]);

  // -- State --
  const [messages, setMessages] = useState<Message[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [subStatus, setSubStatus] = useState<string>("SUBSCRIBING");

  // -- Refs --
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryFnsRef = useRef<Map<string, () => Promise<void>>>(new Map());
  const isMountedRef = useRef(true);  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // iOS Safari virtual viewport handling
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      setViewportHeight(vv.height);
      // Auto scroll to bottom when viewport changes (e.g. keyboard opens)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  // Draft persistence
  const draftKey = `chat-draft-${bookingId}`;

  // -- Helpers --
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const senderName =
    user.user_metadata?.name || user.email?.split("@")[0] || t("user");

  const notifyRecipient = useCallback(async () => {
    if (!user || !booking) return;
    const isDriver = user.id === booking.rides.driver_id;
    const recipientId = isDriver
      ? booking.passenger_id
      : booking.rides.driver_id;
    await notifyNewMessage(recipientId, senderName, booking.ride_id, booking.id);
  }, [user, booking, senderName]);

  const handleMarkAsRead = useCallback(async () => {
    try {
      await markMessagesAsRead(bookingId);
      // Broadcast to other tabs
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`chat-read:${bookingId}`);
        bc.postMessage({ type: "mark-as-read", userId: user.id });
        bc.close();
      }
    } catch {
      /* silent fail */
    }
  }, [bookingId, user.id]);

  const addLocalMessage = useCallback((msg: LocalMessage) => {
    setLocalMessages((prev) => [...prev, msg]);
  }, []);

  const updateLocalMessage = useCallback(
    (tempId: string, updates: Partial<LocalMessage>) => {
      setLocalMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const removeLocalMessage = useCallback((tempId: string) => {
    setLocalMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    retryFnsRef.current.delete(tempId);
  }, []);

  // -- Effects --

  useEffect(() => {
    isMountedRef.current = true;
    ProductAnalytics.chatOpened(bookingId);

    // Restore draft
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setNewMessage(saved);
    } catch {
      // localStorage may be unavailable
    }

    // Online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      isMountedRef.current = false;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [bookingId, draftKey]);

  // Persist draft on change
  useEffect(() => {
    try {
      if (newMessage.trim()) {
        localStorage.setItem(draftKey, newMessage);
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch {
      // localStorage may be unavailable
    }
  }, [newMessage, draftKey]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles(name, avatar_url)
        `
        )
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (!isMountedRef.current) return;
      if (data) setMessages(data as Message[]);
      setLoading(false);
      handleMarkAsRead();
    };

    loadMessages();
  }, [bookingId, supabase, handleMarkAsRead]);

  // Realtime subscription with reconnect and UPDATE receipt syncing
  useEffect(() => {
    if (!bookingId || !isOnline) return;

    let channel: ReturnType<typeof supabase.channel>;

    const setup = () => {
      channel = supabase
        .channel(`messages:${bookingId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `booking_id=eq.${bookingId}`,
          },
          async (
            payload: import("@supabase/supabase-js").RealtimePostgresInsertPayload<
              Record<string, unknown>
            >
          ) => {
            // Quick dedup check using ref to prevent resubscription dependency leak
            const newId = payload.new.id as string;
            if (messagesRef.current.some((m) => m.id === newId)) return;

            const { data: newMessage } = await supabase
              .from("messages")
              .select(
                `
                *,
                sender:profiles(name, avatar_url)
              `
              )
              .eq("id", newId)
              .single();

            if (!newMessage || !isMountedRef.current) return;

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage as Message];
            });

            setLocalMessages((prev) =>
              prev.filter(
                (m) =>
                  !(
                    m.sender_id === newMessage.sender_id &&
                    m.content === newMessage.content &&
                    m.type === newMessage.type
                  )
              )
            );

            if (newMessage.sender_id !== user.id) {
              handleMarkAsRead();
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `booking_id=eq.${bookingId}`,
          },
          (
            payload: import("@supabase/supabase-js").RealtimePostgresUpdatePayload<
              Record<string, unknown>
            >
          ) => {
            const updatedMsg = payload.new as unknown as Message;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, read: updatedMsg.read } : m))
            );
          }
        )
        .subscribe((status: string) => {
          setSubStatus(status);
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setTimeout(() => {
              if (isMountedRef.current) {
                supabase.removeChannel(channel);
                setup();
              }
            }, 3000);
          }
        });
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [bookingId, supabase, user.id, handleMarkAsRead, isOnline]);

  // Auto-scroll (debounced)
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, localMessages.length, scrollToBottom]);;

  // Cross-tab unread sync via BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel(`chat-read:${bookingId}`);
    bc.onmessage = (ev) => {
      if (ev.data?.type === "mark-as-read" && ev.data.userId === user.id) {
        // Another tab marked messages as read — update local state
        setMessages((prev) =>
          prev.map((m) => (m.sender_id !== user.id ? { ...m, read: true } : m))
        );
      }
    };
    return () => bc.close();
  }, [bookingId, user.id]);

  // Mark as read when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleMarkAsRead();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [handleMarkAsRead]);

  // -- Retry Handler --
  const handleRetry = useCallback(
    async (tempId: string) => {
      const retryFn = retryFnsRef.current.get(tempId);
      if (!retryFn) return;

      setRetryingId(tempId);
      updateLocalMessage(tempId, { status: "pending" });

      try {
        await retryFn();
        removeLocalMessage(tempId);
        await notifyRecipient();
      } catch (err: unknown) {
        updateLocalMessage(tempId, { status: "failed" });
        const msg = err instanceof Error ? err.message : t("sendError");
        toast.error(msg);
        console.error("[Chat] Retry failed:", err);
      } finally {
        setRetryingId(null);
      }
    },
    [updateLocalMessage, removeLocalMessage, notifyRecipient, t]
  );

  // -- Handlers: Text --
  const handleSendText = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newMessage.trim() || sending || !booking) return;

      const messageText = newMessage.trim();
      setNewMessage("");
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setSending(true);

      const tempId = `local-${Date.now()}`;
      addLocalMessage({
        id: tempId,
        tempId,
        booking_id: bookingId,
        sender_id: user.id,
        content: messageText,
        type: "text",
        read: false,
        created_at: new Date().toISOString(),
        sender: { name: senderName, avatar_url: null },
        status: "pending",
      });

      retryFnsRef.current.set(tempId, async () => {
        await sendMessage({
          booking_id: bookingId,
          content: messageText,
          type: "text",
        });
      });

      try {
        await retryFnsRef.current.get(tempId)!();
        removeLocalMessage(tempId);
        await notifyRecipient();
      } catch (err: unknown) {
        updateLocalMessage(tempId, { status: "failed" });
        const msg = err instanceof Error ? err.message : t("sendError");
        toast.error(msg);
        console.error("[Chat] Text send failed:", err);
      } finally {
        setSending(false);
      }
    },
    [
      newMessage,
      sending,
      booking,
      bookingId,
      user.id,
      senderName,
      addLocalMessage,
      removeLocalMessage,
      updateLocalMessage,
      notifyRecipient,
      t,
    ]
  );

  // -- Handlers: Image --
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("imageSizeError"));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [t]
  );

  const sendImage = useCallback(async () => {
    if (!imagePreview || !bookingId) return;

    setUploadingImage(true);
    const tempId = `local-${Date.now()}`;
    const previewUrl = imagePreview;

    addLocalMessage({
      id: tempId,
      tempId,
      booking_id: bookingId,
      sender_id: user.id,
      content: `📷 ${t("image")}`,
      type: "image",
      media_url: previewUrl,
      read: false,
      created_at: new Date().toISOString(),
      sender: { name: senderName, avatar_url: null },
      status: "pending",
    });

    setImagePreview(null);

    retryFnsRef.current.set(tempId, async () => {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const fileName = `${bookingId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw new Error(t("imageUploadError"));

      const { data: publicUrlData } = supabase.storage
        .from("chat-images")
        .getPublicUrl(fileName);

      await sendMessage({
        booking_id: bookingId,
        content: `📷 ${t("image")}`,
        type: "image",
        media_url: publicUrlData.publicUrl,
      });
    });

    try {
      await retryFnsRef.current.get(tempId)!();
      removeLocalMessage(tempId);
      await notifyRecipient();
    } catch (err: unknown) {
      updateLocalMessage(tempId, { status: "failed" });
      const msg = err instanceof Error ? err.message : t("uploadError");
      toast.error(msg);
      console.error("[Chat] Image send failed:", err);
    } finally {
      setUploadingImage(false);
    }
  }, [
    imagePreview,
    bookingId,
    user.id,
    senderName,
    addLocalMessage,
    removeLocalMessage,
    updateLocalMessage,
    notifyRecipient,
    t,
    supabase,
  ]);

  // -- Handlers: Location --
  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t("geolocationNotSupported"));
      return;
    }

    const toastId = toast.loading(t("gettingLocation"));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss(toastId);
        const tempId = `local-${Date.now()}`;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        addLocalMessage({
          id: tempId,
          tempId,
          booking_id: bookingId,
          sender_id: user.id,
          content: `📍 ${t("sharedLocation")}`,
          type: "location",
          location_lat: lat,
          location_lng: lng,
          read: false,
          created_at: new Date().toISOString(),
          sender: { name: senderName, avatar_url: null },
          status: "pending",
        });

        retryFnsRef.current.set(tempId, async () => {
          await sendMessage({
            booking_id: bookingId,
            content: `📍 ${t("sharedLocation")}`,
            type: "location",
            location_lat: lat,
            location_lng: lng,
          });
        });

        try {
          await retryFnsRef.current.get(tempId)!();
          removeLocalMessage(tempId);
          await notifyRecipient();
        } catch (err: unknown) {
          updateLocalMessage(tempId, { status: "failed" });
          const msg = err instanceof Error ? err.message : t("locationError");
          toast.error(msg);
          console.error("[Chat] Location send failed:", err);
        }
      },
      () => {
        toast.dismiss(toastId);
        toast.error(t("locationFailed"));
      }
    );
  }, [
    bookingId,
    user.id,
    senderName,
    addLocalMessage,
    removeLocalMessage,
    updateLocalMessage,
    notifyRecipient,
    t,
  ]);

  // -- Handlers: Audio --
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await processAudioSend(audioBlob, recordingTime);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error(t("microphoneAccessError"));
    }
  }, [recordingTime, t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  const processAudioSend = useCallback(
    async (blob: Blob, duration: number) => {
      if (!bookingId) return;
      const tempId = `local-${Date.now()}`;

      addLocalMessage({
        id: tempId,
        tempId,
        booking_id: bookingId,
        sender_id: user.id,
        content: `🎵 ${t("voiceMessage")}`,
        type: "audio",
        duration,
        read: false,
        created_at: new Date().toISOString(),
        sender: { name: senderName, avatar_url: null },
        status: "pending",
      });

      retryFnsRef.current.set(tempId, async () => {
        const fileName = `${bookingId}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("chat-audio")
          .upload(fileName, blob, { contentType: "audio/webm" });

        if (uploadError) throw new Error(t("audioUploadError"));

        const { data: publicUrlData } = supabase.storage
          .from("chat-audio")
          .getPublicUrl(fileName);

        await sendMessage({
          booking_id: bookingId,
          content: `🎵 ${t("voiceMessage")}`,
          type: "audio",
          media_url: publicUrlData.publicUrl,
          duration: duration,
        });
      });

      try {
        await retryFnsRef.current.get(tempId)!();
        removeLocalMessage(tempId);
        await notifyRecipient();
      } catch (err: unknown) {
        updateLocalMessage(tempId, { status: "failed" });
        const msg = err instanceof Error ? err.message : t("uploadError");
        toast.error(msg);
        console.error("[Chat] Audio send failed:", err);
      }
    },
    [
      bookingId,
      user.id,
      senderName,
      addLocalMessage,
      removeLocalMessage,
      updateLocalMessage,
      notifyRecipient,
      t,
      supabase,
    ]
  );

  const toggleAudio = useCallback(
    (url: string) => {
      if (playingAudio === url) {
        audioRef.current?.pause();
        setPlayingAudio(null);
      } else {
        audioRef.current?.pause();
        // Clean up previous audio
        if (audioRef.current) {
          audioRef.current.src = "";
        }
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setPlayingAudio(null);
        audioRef.current.onerror = () => setPlayingAudio(null);
        audioRef.current.play().catch(() => setPlayingAudio(null));
        setPlayingAudio(url);
      }
    },
    [playingAudio]
  );

  // -- Loading / Error states --
  // Memoize display messages to avoid re-sorting on every render
  const displayMessages = useMemo<DisplayMessage[]>(() => {
    const merged = [
      ...messages,
      ...localMessages.filter(
        (lm) =>
          !messages.some(
            (m) =>
              m.sender_id === lm.sender_id &&
              m.content === lm.content &&
              m.type === lm.type
          )
      ),
    ];
    merged.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return merged;
  }, [messages, localMessages]);

  // -- Memoized callbacks for sub-components --
  const handleToggleAudio = useCallback(
    (url: string) => toggleAudio(url),
    [toggleAudio]
  );
  const handleZoomImage = useCallback(
    (url: string) => setZoomedImage(url),
    []
  );
  const handleRetryWrapped = useCallback(
    (tempId: string) => handleRetry(tempId),
    [handleRetry]
  );

  // -- Loading / Error states --
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="size-10 animate-spin text-accent" strokeWidth={1.5} />
      </div>
    );
  }

  const otherParticipant = (() => {
    if (!booking || !user) return null;
    const isDriver = booking.rides.driver_id === user.id;
    return isDriver ? booking.passenger : booking.rides.profiles;
  })();

  // ============================================================
  // VIEWS
  // ============================================================

  function ChatMobile() {
    return (
      <div 
        className="fixed inset-x-0 bottom-0 top-16 z-10 flex flex-col bg-bg"
        style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
      >
        {/* Header */}
        <header className="flex w-full shrink-0 items-center gap-3 border-b border-line bg-bg px-4 py-3 sm:px-6">
          <Link
            href={`/${locale}/chat`}
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] text-fg transition-colors hover:bg-surface-2"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </Link>
          <div className="relative shrink-0">
            <Avatar
              src={otherParticipant?.avatar_url}
              name={otherParticipant?.name}
              size="md"
            />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-bg bg-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-fg">
              {otherParticipant?.name || t("chat")}
            </h1>
            <p className="truncate text-xs text-muted">
              {booking?.rides.from_city} → {booking?.rides.to_city}
            </p>
          </div>
        </header>

        {/* Offline banner */}
        {!isOnline && (
          <div className="flex shrink-0 items-center gap-2 border-b border-line bg-bad/10 px-4 py-2">
            <WifiOff className="size-4 text-bad" strokeWidth={1.5} />
            <span className="text-xs font-medium text-bad">{t("offline")}</span>
          </div>
        )}

        {/* Route meta */}
        <div className="flex shrink-0 items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
          <div className="flex flex-col">
            <span className="font-mono text-[11px] text-dim">
              {booking?.rides.date} · {booking?.rides.time.slice(0, 5)}
            </span>
          </div>
          {booking?.status !== "cancelled" && (
            <Link
              href={`/cancella/${bookingId}`}
              className="text-xs font-medium lowercase text-[var(--bad)] transition-colors hover:text-[var(--bad)]/80"
            >
              {t("cancel")}
            </Link>
          )}
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-8 chat-scroll flex flex-col gap-8"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-[11px] text-dim">{t("today")}</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          {displayMessages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="heading-editorial text-lg text-fg">{t("noMessages")}</p>
              <p className="mt-2 text-sm text-muted">{t("startConversation")}</p>
            </div>
          ) : (
            displayMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={user.id}
                playingAudio={playingAudio}
                onToggleAudio={handleToggleAudio}
                onZoomImage={handleZoomImage}
                onRetry={handleRetryWrapped}
                retryingId={retryingId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <footer className="shrink-0 border-t border-line bg-bg px-4 pt-4 safe-area-pb sm:px-6">
          <ChatInput
            mobile
            isOnline={isOnline}
            isRecording={isRecording}
            recordingTime={recordingTime}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSend={handleSendText}
            sending={sending}
            uploadingImage={uploadingImage}
            onImageSelect={handleImageSelect}
            onSendLocation={sendLocation}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
        </footer>
      </div>
    );
  }

  function ChatDesktop() {
    return (
      <div className="fixed inset-x-0 bottom-0 top-20 z-10 flex justify-center bg-bg">
        <div className="flex h-full w-full max-w-4xl flex-col">
          {/* Header */}
          <header className="flex w-full shrink-0 items-center gap-4 border-b border-line px-8 py-6">
            <Link
              href={`/${locale}/chat`}
              className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] text-fg transition-colors hover:bg-surface-2"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} />
            </Link>
            <div className="relative shrink-0">
              <Avatar
                src={otherParticipant?.avatar_url}
                name={otherParticipant?.name}
                size="lg"
              />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-bg bg-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold text-fg">
                {otherParticipant?.name || t("chat")}
              </h1>
              <p className="truncate text-sm text-muted">
                {booking?.rides.from_city} → {booking?.rides.to_city} · {booking?.rides.date}
              </p>
            </div>
            {booking?.status !== "cancelled" && (
              <Link
                href={`/cancella/${bookingId}`}
                className="text-sm font-medium lowercase text-[var(--bad)] transition-colors hover:text-[var(--bad)]/80"
              >
                {t("cancelBooking")}
              </Link>
            )}
          </header>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-8 py-10 chat-scroll flex flex-col gap-10"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-line" />
              <span className="font-mono text-[11px] text-dim">{t("today")}</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            {displayMessages.length === 0 ? (
              <div className="py-16 text-center">
                <p className="heading-editorial text-lg text-fg">{t("noMessages")}</p>
                <p className="mt-2 text-sm text-muted">{t("startConversation")}</p>
              </div>
            ) : (
              displayMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={user.id}
                  playingAudio={playingAudio}
                  onToggleAudio={handleToggleAudio}
                  onZoomImage={handleZoomImage}
                  onRetry={handleRetryWrapped}
                  retryingId={retryingId}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <footer className="shrink-0 border-t border-line bg-bg px-8 pb-8 pt-4">
            <ChatInput
              isOnline={isOnline}
              isRecording={isRecording}
              recordingTime={recordingTime}
              newMessage={newMessage}
              onNewMessageChange={setNewMessage}
              onSend={handleSendText}
              sending={sending}
              uploadingImage={uploadingImage}
              onImageSelect={handleImageSelect}
              onSendLocation={sendLocation}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />
          </footer>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {deviceType === "desktop" ? <ChatDesktop /> : <ChatMobile />}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={imagePreview}
              alt={t("preview")}
              width={600}
              height={400}
              className="w-full rounded-lg"
            />
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setImagePreview(null)}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={sendImage}
                disabled={uploadingImage}
                className="flex-1"
              >
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  t("send")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <X className="h-8 w-8" />
          </button>
          <Image
            src={zoomedImage}
            alt={t("zoomedImageAlt")}
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </ErrorBoundary>
  );
}
