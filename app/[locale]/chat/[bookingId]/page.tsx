"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, X, Mic, Play, Pause, ArrowLeft, MapPin, SlidersHorizontal, User, Plus, Send } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { notifyNewMessage } from "@/lib/notifications";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { useDeviceType } from "@/components/view-mode";

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'audio';
  media_url?: string;
  location_lat?: number;
  location_lng?: number;
  duration?: number;
  read: boolean;
  created_at: string;
  sender: {
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

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const deviceType = useDeviceType();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadData = async () => {
      if (!bookingId) return;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          rides(
            from_city,
            to_city,
            date,
            time,
            driver_id,
            profiles(name, avatar_url)
          ),
          passenger:profiles!bookings_passenger_id_fkey(name, avatar_url)
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError || !bookingData) {
        setError("Chat non trovata.");
        setLoading(false);
        return;
      }

      const isDriver = bookingData.rides.driver_id === currentUser.id;
      const isPassenger = bookingData.passenger_id === currentUser.id;
      
      if (!isDriver && !isPassenger) {
        setError("Non hai accesso a questa chat.");
        setLoading(false);
        return;
      }

      setBooking(bookingData);

      const { data: messagesData } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles(name, avatar_url)
        `)
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);
      setLoading(false);
    };

    loadData();
  }, [bookingId, router, supabase]);

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
            .select(`
              *,
              sender:profiles(name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, supabase]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || sending || !booking) return;

    setSending(true);

    const { error: sendError } = await supabase
      .from("messages")
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        content: newMessage.trim(),
        type: 'text',
        read: false,
      });

    if (sendError) {
      toast.error("Errore nell'invio del messaggio");
    } else {
      setNewMessage("");
      await notifyRecipient();
    }

    setSending(false);
  };

  const sendMessage = async (data: {
    content: string;
    type: 'text' | 'image' | 'location' | 'audio';
    media_url?: string;
    location_lat?: number;
    location_lng?: number;
    duration?: number;
  }) => {
    if (!user || !booking) return;

    setSending(true);

    const { error: sendError } = await supabase
      .from("messages")
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        content: data.content,
        type: data.type,
        media_url: data.media_url,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        duration: data.duration,
        read: false,
      });

    if (sendError) {
      toast.error("Errore nell'invio del messaggio");
    } else {
      await notifyRecipient();
    }

    setSending(false);
  };

  const notifyRecipient = async () => {
    if (!user || !booking) return;
    const isDriver = user.id === booking.rides.driver_id;
    const recipientId = isDriver ? booking.passenger_id : booking.rides.driver_id;
    const senderName = user.user_metadata?.name || user.email?.split("@")[0] || "Utente";
    
    await notifyNewMessage(
      recipientId,
      senderName,
      booking.ride_id,
      booking.id
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine deve essere inferiore a 5MB");
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
    try {
      const response = await fetch(imagePreview);
      const blob = await response.blob();

      const fileName = `${bookingId}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      await sendMessage({
        content: '📷 Immagine',
        type: 'image',
        media_url: publicUrl,
      });

      setImagePreview(null);
    } catch {
      toast.error("Errore nel caricamento dell'immagine");
    } finally {
      setUploadingImage(false);
    }
  };

  const sendLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalizzazione non supportata");
      return;
    }

    toast.loading("Ottenendo posizione...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss();
        await sendMessage({
          content: '📍 Posizione condivisa',
          type: 'location',
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude,
        });
      },
      () => {
        toast.dismiss();
        toast.error("Impossibile ottenere la posizione");
      }
    );
  };

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioMessage(audioBlob, recordingTime);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Impossibile accedere al microfono");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const sendAudioMessage = async (blob: Blob, duration: number) => {
    if (!bookingId) return;

    try {
      const fileName = `${bookingId}/${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-audio')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-audio')
        .getPublicUrl(fileName);

      await sendMessage({
        content: '🎵 Messaggio vocale',
        type: 'audio',
        media_url: publicUrl,
        duration: duration,
      });
    } catch {
      toast.error("Errore nell'invio del messaggio vocale");
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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMyMessage = (senderId: string) => senderId === user?.id;

  const getOtherParticipant = () => {
    if (!booking || !user) return null;
    const isDriver = booking.rides.driver_id === user.id;
    return isDriver ? booking.passenger : booking.rides.profiles;
  };

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
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-on-surface">{error}</h1>
        <Link
          href="/profilo"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-on-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna al profilo
        </Link>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  function MessageBubble({ message }: { message: Message }) {
    const isMine = isMyMessage(message.sender_id);
    return (
      <div
        className={`flex flex-col ${isMine ? "items-end self-end" : "items-start"} max-w-[85%] gap-2`}
      >
        <div
          className={`${
            isMine
              ? "bg-primary/10 border border-primary/20 rounded-xl rounded-br-none"
              : "bg-surface-container-low rounded-xl rounded-bl-none"
          } p-4 text-sm leading-relaxed text-on-surface`}
        >
          {message.type === 'image' && message.media_url && (
            <div className="mb-2">
              <Image
                src={message.media_url}
                alt="Immagine condivisa"
                width={400}
                height={300}
                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setZoomedImage(message.media_url!)}
              />
            </div>
          )}

          {message.type === 'location' && message.location_lat && message.location_lng && (
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs uppercase tracking-tight text-primary">Posizione Condivisa</span>
                  <span className="text-[10px] text-primary/70">Lat: {message.location_lat.toFixed(4)}</span>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${message.location_lat},${message.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="w-full h-32 rounded-lg overflow-hidden bg-surface-container-high relative">
                  <Image
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.location_lat},${message.location_lng}&zoom=15&size=300x150&markers=color:red%7C${message.location_lat},${message.location_lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                    alt="Mappa posizione"
                    fill
                    className="object-cover grayscale opacity-60"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                  <MapPin className="w-4 h-4" />
                  <span>Apri in Google Maps</span>
                </div>
              </a>
            </div>
          )}

          {message.type === 'audio' && message.media_url && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleAudio(message.media_url!)}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary"
              >
                {playingAudio === message.media_url ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div className="flex items-end gap-[2px] h-8">
                {[2, 4, 6, 3, 5, 8, 4, 6, 3, 5, 2, 7, 4, 5].map((h, i) => (
                  <div key={i} className="waveform-bar" style={{ height: `${h * 3}px` }} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-primary">{formatDuration(message.duration || 0)}</span>
            </div>
          )}

          {message.content && message.type === 'text' && (
            <p className={isMine ? "text-primary" : "text-on-surface"}>{message.content}</p>
          )}
          {message.content && message.type !== 'text' && (
            <p className="text-on-surface/60 text-xs mt-2">{message.content}</p>
          )}
        </div>
        <span className="text-[10px] font-medium text-on-surface/40 px-1">{formatTime(message.created_at)}</span>
      </div>
    );
  }

  function ChatMobile() {
    return (
      <div className="flex h-[100dvh] flex-col bg-[#0a0a0a]">
        <header className="bg-[#0e0e0e] flex justify-between items-end w-full px-4 sm:px-6 pt-4 pb-4 shrink-0">
          <div className="flex flex-col">
            <span className="font-semibold uppercase tracking-widest text-[11px] text-primary">ANDAMUS LIVE</span>
            <h1 className="font-extrabold tracking-tighter text-2xl uppercase text-on-surface">
              {otherParticipant?.name || "Chat"}
            </h1>
          </div>
          <div className="flex items-center gap-4 pb-1">
            <button className="text-on-surface hover:opacity-80 transition-opacity"><SlidersHorizontal className="w-5 h-5" /></button>
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden">
              {otherParticipant?.avatar_url ? (
                <img src={otherParticipant.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-on-surface-variant" />
              )}
            </div>
          </div>
        </header>

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
                {booking?.rides.date} · {booking?.rides.time.slice(0,5)}
              </span>
            </div>
          </div>
          <div className="bg-surface-container-high px-3 py-2 rounded-lg">
            <span className="text-[10px] font-extrabold text-primary">LIVE TRACKING</span>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-8 chat-scroll flex flex-col gap-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40">Oggi</span>
          </div>

          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-on-surface-variant">Inizia la conversazione...</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="bg-[#131313] px-4 sm:px-6 pb-10 pt-6 shrink-0 safe-area-pb">
          {isRecording && (
            <div className="mb-3 flex items-center justify-between bg-error/10 border border-error/20 rounded-full px-4 py-2 text-sm truncate">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                <span className="text-error text-sm font-medium">Registrazione...</span>
              </div>
              <span className="text-error font-mono text-sm">{formatDuration(recordingTime)}</span>
            </div>
          )}

          <div className="flex items-center gap-4 bg-surface-container-highest rounded-2xl px-4 py-3 border-b-2 border-primary">
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
              disabled={isRecording}
              className="text-on-surface/60 hover:text-primary transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={isRecording ? "Registrazione..." : "Scrivi un messaggio..."}
              disabled={isRecording}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-on-surface/30 text-on-surface disabled:opacity-50"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={sendLocation}
                disabled={isRecording}
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
                disabled={!!newMessage.trim()}
                className={`text-on-surface/60 hover:text-primary transition-colors disabled:opacity-0 ${isRecording ? 'text-error' : ''}`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSendMessage()}
                disabled={sending || !newMessage.trim() || isRecording}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary transform active:scale-90 transition-all disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  function ChatDesktop() {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center">
        <div className="w-full max-w-4xl flex flex-col h-screen">
          <header className="bg-[#0e0e0e] flex justify-between items-center w-full px-8 pt-10 pb-6 shrink-0">
            <div className="flex flex-col">
              <span className="font-semibold uppercase tracking-widest text-xs text-primary mb-1">ANDAMUS LIVE</span>
              <h1 className="font-extrabold tracking-tighter text-3xl uppercase text-on-surface">
                {otherParticipant?.name || "Chat"}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-on-surface hover:opacity-80 transition-opacity"><SlidersHorizontal className="w-6 h-6" /></button>
              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center overflow-hidden">
                {otherParticipant?.avatar_url ? (
                  <img src={otherParticipant.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-on-surface-variant" />
                )}
              </div>
            </div>
          </header>

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
                  {booking?.rides.date} · {booking?.rides.time.slice(0,5)}
                </span>
              </div>
            </div>
            <div className="bg-surface-container-high px-4 py-2 rounded-lg">
              <span className="text-xs font-extrabold text-primary">LIVE TRACKING</span>
            </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto px-8 py-10 chat-scroll flex flex-col gap-10"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex justify-center">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface/40">Oggi</span>
            </div>

            {messages.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-on-surface-variant text-lg">Inizia la conversazione...</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex flex-col ${isMyMessage(message.sender_id) ? "items-end self-end" : "items-start"} max-w-[70%] gap-3`}>
                  <div
                    className={`${
                      isMyMessage(message.sender_id)
                        ? "bg-primary/10 border border-primary/20 rounded-2xl rounded-br-none"
                        : "bg-surface-container-low rounded-2xl rounded-bl-none"
                    } p-5 text-base leading-relaxed text-on-surface`}
                  >
                    {message.type === 'image' && message.media_url && (
                      <div className="mb-2">
                        <Image
                          src={message.media_url}
                          alt="Immagine condivisa"
                          width={400}
                          height={300}
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setZoomedImage(message.media_url!)}
                        />
                      </div>
                    )}

                    {message.type === 'location' && message.location_lat && message.location_lng && (
                      <div className="mb-2">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs uppercase tracking-tight text-primary">Posizione Condivisa</span>
                            <span className="text-[10px] text-primary/70">Lat: {message.location_lat.toFixed(4)}</span>
                          </div>
                        </div>
                        <a
                          href={`https://maps.google.com/?q=${message.location_lat},${message.location_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="w-full h-40 rounded-lg overflow-hidden bg-surface-container-high relative">
                            <Image
                              src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.location_lat},${message.location_lng}&zoom=15&size=300x150&markers=color:red%7C${message.location_lat},${message.location_lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                              alt="Mappa posizione"
                              fill
                              className="object-cover grayscale opacity-60"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                            <MapPin className="w-4 h-4" />
                            <span>Apri in Google Maps</span>
                          </div>
                        </a>
                      </div>
                    )}

                    {message.type === 'audio' && message.media_url && (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleAudio(message.media_url!)}
                          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary"
                        >
                          {playingAudio === message.media_url ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>
                        <div className="flex items-end gap-[2px] h-8">
                          {[2, 4, 6, 3, 5, 8, 4, 6, 3, 5, 2, 7, 4, 5].map((h, i) => (
                            <div key={i} className="waveform-bar" style={{ height: `${h * 3}px` }} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-primary">{formatDuration(message.duration || 0)}</span>
                      </div>
                    )}

                    {message.content && message.type === 'text' && (
                      <p className={isMyMessage(message.sender_id) ? "text-primary" : "text-on-surface"}>{message.content}</p>
                    )}
                    {message.content && message.type !== 'text' && (
                      <p className="text-on-surface/60 text-xs mt-2">{message.content}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-on-surface/40 px-1">{formatTime(message.created_at)}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="bg-[#131313] px-8 pb-8 pt-6 shrink-0">
            {isRecording && (
              <div className="mb-4 flex items-center justify-between bg-error/10 border border-error/20 rounded-full px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span className="text-error text-sm font-medium">Registrazione...</span>
                </div>
                <span className="text-error font-mono text-sm">{formatDuration(recordingTime)}</span>
              </div>
            )}

            <div className="flex items-center gap-4 bg-surface-container-highest rounded-3xl px-6 py-4 border-b-2 border-primary">
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
                disabled={isRecording}
                className="text-on-surface/60 hover:text-primary transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={isRecording ? "Registrazione..." : "Scrivi un messaggio..."}
                disabled={isRecording}
                className="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-on-surface/30 text-on-surface disabled:opacity-50"
              />

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={sendLocation}
                  disabled={isRecording}
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
                  disabled={!!newMessage.trim()}
                  className={`text-on-surface/60 hover:text-primary transition-colors disabled:opacity-0 ${isRecording ? 'text-error' : ''}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={sending || !newMessage.trim() || isRecording}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary transform active:scale-90 transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <>
      {deviceType === "desktop" ? <ChatDesktop /> : <ChatMobile />}

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
              alt="Preview"
              width={600}
              height={400}
              className="w-full rounded-lg"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setImagePreview(null)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20"
              >
                Annulla
              </button>
              <button
                onClick={sendImage}
                disabled={uploadingImage}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-medium hover:opacity-90 disabled:opacity-50"
              >
                {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Invia'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            alt="Immagine ingrandita"
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
