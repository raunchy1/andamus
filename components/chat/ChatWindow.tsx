"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markMessagesAsRead } from "@/lib/chat-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  X,
  Mic,
  Play,
  Pause,
  ArrowLeft,
  MapPin,
  SlidersHorizontal,
  User,
  Plus,
  Send,
  Check,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { notifyNewMessage } from "@/lib/notifications";
import { useDeviceType } from "@/components/view-mode";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
// COMPONENT
// ============================================================
export default function ChatWindow({
  bookingId,
  booking,
  user,
}: ChatWindowProps) {
  const supabase = createClient();
  const deviceType = useDeviceType();
  const t = useTranslations("chat");

  // -- State --
  const [messages, setMessages] = useState<Message[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // -- Refs --
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryFnsRef = useRef<Map<string, () => Promise<void>>>(new Map());

  // -- Helpers --
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isMyMessage = (senderId: string) => senderId === user?.id;

  const getOtherParticipant = () => {
    if (!booking || !user) return null;
    const isDriver = booking.rides.driver_id === user.id;
    return isDriver ? booking.passenger : booking.rides.profiles;
  };

  const senderName =
    user.user_metadata?.name || user.email?.split("@")[0] || t("user");

  const notifyRecipient = async () => {
    if (!user || !booking) return;
    const isDriver = user.id === booking.rides.driver_id;
    const recipientId = isDriver
      ? booking.passenger_id
      : booking.rides.driver_id;
    await notifyNewMessage(recipientId, senderName, booking.ride_id, booking.id);
  };

  const handleMarkAsRead = async () => {
    try {
      await markMessagesAsRead(bookingId);
    } catch {
      /* silent fail – read receipts are not critical */
    }
  };

  const addLocalMessage = (msg: LocalMessage) => {
    setLocalMessages((prev) => [...prev, msg]);
  };

  const updateLocalMessage = (tempId: string, updates: Partial<LocalMessage>) => {
    setLocalMessages((prev) =>
      prev.map((m) => (m.tempId === tempId ? { ...m, ...updates } : m))
    );
  };

  const removeLocalMessage = (tempId: string) => {
    setLocalMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    retryFnsRef.current.delete(tempId);
  };

  // -- Effects --

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

      if (data) setMessages(data as Message[]);
      setLoading(false);
      handleMarkAsRead();
    };

    loadMessages();
  }, [bookingId, supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:profiles(name, avatar_url)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage as Message];
            });

            // Remove any matching local message (avoid duplicates)
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, supabase, user.id]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages, localMessages]);

  // Cleanup recording timer
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      audioRef.current?.pause();
    };
  }, []);

  // -- Retry Handler --

  const handleRetry = async (tempId: string) => {
    const retryFn = retryFnsRef.current.get(tempId);
    if (!retryFn) return;

    setRetryingId(tempId);
    updateLocalMessage(tempId, { status: "pending" });

    try {
      await retryFn();
      removeLocalMessage(tempId);
      await notifyRecipient();
    } catch (err: any) {
      updateLocalMessage(tempId, { status: "failed" });
      const msg =
        err?.message || t("sendError");
      toast.error(msg);
      console.error("[Chat] Retry failed:", err);
    } finally {
      setRetryingId(null);
    }
  };

  // -- Handlers: Text --

  const handleSendText = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending || !booking) return;

    const messageText = newMessage.trim();
    setNewMessage("");
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
    } catch (err: any) {
      updateLocalMessage(tempId, { status: "failed" });
      const msg =
        err?.message || t("sendError");
      toast.error(msg);
      console.error("[Chat] Text send failed:", err);
    } finally {
      setSending(false);
    }
  };

  // -- Handlers: Image --

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const sendImage = async () => {
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
    } catch (err: any) {
      updateLocalMessage(tempId, { status: "failed" });
      const msg = err?.message || t("uploadError");
      toast.error(msg);
      console.error("[Chat] Image send failed:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  // -- Handlers: Location --

  const sendLocation = () => {
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
        } catch (err: any) {
          updateLocalMessage(tempId, { status: "failed" });
          const msg =
            err?.message || t("locationError");
          toast.error(msg);
          console.error("[Chat] Location send failed:", err);
        }
      },
      () => {
        toast.dismiss(toastId);
        toast.error(t("locationFailed"));
      }
    );
  };

  // -- Handlers: Audio --

  const startRecording = async () => {
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
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const processAudioSend = async (blob: Blob, duration: number) => {
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
    } catch (err: any) {
      updateLocalMessage(tempId, { status: "failed" });
      const msg =
        err?.message || t("uploadError");
      toast.error(msg);
      console.error("[Chat] Audio send failed:", err);
    }
  };

  const toggleAudio = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      audioRef.current?.pause();
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlayingAudio(null);
      audioRef.current.play();
      setPlayingAudio(url);
    }
  };

  // -- Loading / Error states --

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <AlertCircle className="mb-4 h-16 w-16 text-error" />
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-on-surface">
          {error}
        </h1>
        <Link
          href="/profilo"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-on-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToProfile")}
        </Link>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  // Combine messages for display
  const displayMessages: DisplayMessage[] = [
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
  ].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // ============================================================
  // SUB-COMPONENTS
  // ============================================================

  function ReadIndicator({ message }: { message: Message }) {
    if (!isMyMessage(message.sender_id)) return null;
    return (
      <span className="text-[9px] font-medium text-primary/60 flex items-center gap-0.5 mt-0.5">
        {message.read ? (
          <>
            <CheckCheck className="w-3 h-3" />
            {t("read")}
          </>
        ) : (
          <>
            <Check className="w-3 h-3" />
            {t("sent")}
          </>
        )}
      </span>
    );
  }

  function MessageBubble({ message }: { message: DisplayMessage }) {
    const isMine = isMyMessage(message.sender_id);
    const isLocal = "status" in message;
    const isPending = isLocal && message.status === "pending";
    const isFailed = isLocal && message.status === "failed";

    return (
      <div
        className={`flex flex-col ${
          isMine ? "items-end self-end" : "items-start"
        } max-w-[85%] gap-1`}
      >
        <div
          className={`relative ${
            isMine
              ? "bg-primary/10 border border-primary/20 rounded-xl rounded-br-none"
              : "bg-surface-container-low rounded-xl rounded-bl-none"
          } p-4 text-sm leading-relaxed text-on-surface ${
            isPending ? "opacity-70" : ""
          } ${isFailed ? "border-error/30 bg-error/5" : ""}`}
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
                onClick={() => handleRetry(message.tempId)}
                disabled={retryingId === message.tempId}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-error-foreground text-xs font-bold hover:bg-error/90 transition-colors disabled:opacity-50"
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
                  !isPending && !isFailed && setZoomedImage(message.media_url!)
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
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-surface-container-high relative">
                      <Image
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.location_lat},${message.location_lng}&zoom=15&size=300x150&markers=color:red%7C${message.location_lat},${message.location_lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                        alt={t("locationMapAlt")}
                        fill
                        className="object-cover grayscale opacity-60"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-surface-container-high flex items-center justify-center">
                      <div className="text-center text-on-surface-variant">
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
                onClick={() => toggleAudio(message.media_url!)}
                disabled={isPending || isFailed}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary disabled:opacity-50"
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
            <p className={isMine ? "text-primary" : "text-on-surface"}>
              {message.content}
            </p>
          )}
          {message.content && message.type !== "text" && (
            <p className="text-on-surface/60 text-xs mt-2">
              {message.content}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] font-medium text-on-surface/40">
            {formatTime(message.created_at)}
          </span>
          {!isLocal && <ReadIndicator message={message as Message} />}
          {isPending && (
            <span className="text-[9px] font-medium text-primary/60">
              {t("sending")}
            </span>
          )}
          {isFailed && (
            <span className="text-[9px] font-medium text-error/80">
              {t("failed")}
            </span>
          )}
        </div>
      </div>
    );
  }

  function ChatInput({ mobile = false }: { mobile?: boolean }) {
    const inputClasses = mobile
      ? "flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-on-surface/30 text-on-surface disabled:opacity-50"
      : "flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-on-surface/30 text-on-surface disabled:opacity-50";

    const containerClasses = mobile
      ? "flex items-center gap-4 bg-surface-container-highest rounded-2xl px-4 py-3 border-b-2 border-primary"
      : "flex items-center gap-4 bg-surface-container-highest rounded-3xl px-6 py-4 border-b-2 border-primary";

    const sendBtnClasses = mobile
      ? "w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary transform active:scale-90 transition-all disabled:opacity-50"
      : "w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary transform active:scale-90 transition-all disabled:opacity-50";

    return (
      <>
        {isRecording && (
          <div
            className={`mb-3 flex items-center justify-between bg-error/10 border border-error/20 rounded-full px-4 py-2 text-sm truncate ${
              mobile ? "" : "mb-4 px-5 py-3"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <span className="text-error text-sm font-medium">
                {t("recording")}
              </span>
            </div>
            <span className="text-error font-mono text-sm">
              {formatDuration(recordingTime)}
            </span>
          </div>
        )}

        <div className={containerClasses}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || uploadingImage}
            className="text-on-surface/60 hover:text-primary transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
            placeholder={
              isRecording ? t("recording") : t("messagePlaceholder")
            }
            disabled={isRecording}
            className={inputClasses}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={sendLocation}
              disabled={isRecording || sending}
              className="text-on-surface/60 hover:text-primary transition-colors disabled:opacity-50"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseLeave={isRecording ? stopRecording : undefined}
              disabled={!!newMessage.trim() || sending}
              className={`text-on-surface/60 hover:text-primary transition-colors disabled:opacity-0 ${
                isRecording ? "text-error" : ""
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSendText()}
              disabled={sending || !newMessage.trim() || isRecording}
              className={sendBtnClasses}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </>
    );
  }

  function ChatMobile() {
    return (
      <div className="flex h-[100dvh] flex-col bg-[#0a0a0a]">
        {/* Header */}
        <header className="bg-[#0e0e0e] flex justify-between items-end w-full px-4 sm:px-6 pt-4 pb-4 shrink-0">
          <div className="flex flex-col">
            <span className="font-semibold uppercase tracking-widest text-[11px] text-primary">
              {t("andamusLive")}
            </span>
            <h1 className="font-extrabold tracking-tighter text-2xl uppercase text-on-surface">
              {otherParticipant?.name || t("chat")}
            </h1>
          </div>
          <div className="flex items-center gap-4 pb-1">
            <button className="text-on-surface hover:opacity-80 transition-opacity">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden">
              {otherParticipant?.avatar_url ? (
                <Image
                  src={otherParticipant.avatar_url}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-on-surface-variant" />
              )}
            </div>
          </div>
        </header>

        {/* Route info */}
        <div className="bg-[#131313] px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="w-[1px] h-4 bg-outline-variant/30" />
              <div className="w-2 h-2 rounded-full bg-outline" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                {booking?.rides.from_city} → {booking?.rides.to_city}
              </span>
              <span className="text-xs text-on-surface/60">
                {booking?.rides.date} · {booking?.rides.time.slice(0, 5)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {booking?.status !== "cancelled" && (
              <Link
                href={`/cancella/${bookingId}`}
                className="px-3 py-2 rounded-lg bg-error/10 text-error text-xs font-bold hover:bg-error/20 transition-colors"
              >
                {t("cancel")}
              </Link>
            )}
            <div className="bg-surface-container-high px-3 py-2 rounded-lg">
              <span className="text-[10px] font-extrabold text-primary">
                {t("liveTracking")}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-8 chat-scroll flex flex-col gap-8"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40">
              {t("today")}
            </span>
          </div>

          {displayMessages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-on-surface-variant">
                {t("startConversation")}
              </p>
            </div>
          ) : (
            displayMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <footer className="bg-[#131313] px-4 sm:px-6 pb-10 pt-6 shrink-0 safe-area-pb">
          <ChatInput mobile />
        </footer>
      </div>
    );
  }

  function ChatDesktop() {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center">
        <div className="w-full max-w-4xl flex flex-col h-screen">
          {/* Header */}
          <header className="bg-[#0e0e0e] flex justify-between items-center w-full px-8 pt-10 pb-6 shrink-0">
            <div className="flex flex-col">
              <span className="font-semibold uppercase tracking-widest text-xs text-primary mb-1">
                {t("andamusLive")}
              </span>
              <h1 className="font-extrabold tracking-tighter text-3xl uppercase text-on-surface">
                {otherParticipant?.name || t("chat")}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-on-surface hover:opacity-80 transition-opacity">
                <SlidersHorizontal className="w-6 h-6" />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center overflow-hidden">
                {otherParticipant?.avatar_url ? (
                  <Image
                    src={otherParticipant.avatar_url}
                    alt=""
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-on-surface-variant" />
                )}
              </div>
            </div>
          </header>

          {/* Route info */}
          <div className="bg-[#131313] px-8 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="w-[1.5px] h-5 bg-outline-variant/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-outline" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
                  {booking?.rides.from_city} → {booking?.rides.to_city}
                </span>
                <span className="text-sm text-on-surface/60">
                  {booking?.rides.date} · {booking?.rides.time.slice(0, 5)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {booking?.status !== "cancelled" && (
                <Link
                  href={`/cancella/${bookingId}`}
                  className="px-4 py-2 rounded-lg bg-error/10 text-error text-sm font-bold hover:bg-error/20 transition-colors"
                >
                  {t("cancelBooking")}
                </Link>
              )}
              <div className="bg-surface-container-high px-4 py-2 rounded-lg">
                <span className="text-xs font-extrabold text-primary">
                  {t("liveTracking")}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-8 py-10 chat-scroll flex flex-col gap-10"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex justify-center">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface/40">
                {t("today")}
              </span>
            </div>

            {displayMessages.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-on-surface-variant text-lg">
                  {t("startConversation")}
                </p>
              </div>
            ) : (
              displayMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <footer className="bg-[#131313] px-8 pb-8 pt-6 shrink-0">
            <ChatInput />
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
              <button
                onClick={() => setImagePreview(null)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20"
              >
                {t("cancel")}
              </button>
              <button
                onClick={sendImage}
                disabled={uploadingImage}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-medium hover:opacity-90 disabled:opacity-50"
              >
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  t("send")
                )}
              </button>
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
