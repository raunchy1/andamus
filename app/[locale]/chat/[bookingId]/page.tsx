"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Send, 
  Loader2,
  AlertCircle,
  User,
  MapPin,
  Mic,
  X,
  Image as ImageIcon,
  StopCircle,
  Play,
  Pause
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { notifyNewMessage } from "@/lib/notifications";
import { NavigationButtons } from "@/components/NavigationButtons";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import toast from "react-hot-toast";

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
  
  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio playback state
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Image zoom modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user, booking and messages
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

  // Real-time subscription
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

  // Send text message
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

  // Send message with media/location
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

  // Image upload
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
      // Convert base64 to blob
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
    } catch (_error) {
      // console.error('Error uploading image:', _error);
      toast.error("Errore nel caricamento dell'immagine");
    } finally {
      setUploadingImage(false);
    }
  };

  // Location sharing
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

  // Voice recording
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
    } catch (_error) {
      // console.error('Error uploading audio:', _error);
      toast.error("Errore nell'invio del messaggio vocale");
    }
  };

  // Audio playback
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
      <div className="min-h-screen bg-[#1a1a2e]">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#e63946]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
          <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">{error}</h1>
          <Link
            href="/profilo"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#e63946] px-6 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna al profilo
          </Link>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <div className="flex h-screen flex-col bg-[#1a1a2e]">
      {/* Chat Header */}
      <header className="border-b border-white/10 bg-[#12121e] px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link
            href="/profilo"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          {otherParticipant && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                {otherParticipant.avatar_url ? (
                  <Image
                    src={otherParticipant.avatar_url}
                    alt={otherParticipant.name}
                    width={40}
                    height={40}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-white">{otherParticipant.name}</h2>
                {booking && (
                  <p className="text-xs text-white/50">
                    {booking.rides.from_city} → {booking.rides.to_city}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {booking && (
            <div className="ml-auto hidden sm:block">
              <NavigationButtons 
                destination={booking.rides.to_city}
                label={booking.rides.to_city}
                variant="compact"
              />
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-white/40">Inizia la conversazione...</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine = isMyMessage(message.sender_id);
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-[#e63946] text-white"
                        : "bg-[#1e2a4a] text-white"
                    }`}
                  >
                    {/* Image Message */}
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

                    {/* Location Message */}
                    {message.type === 'location' && message.location_lat && message.location_lng && (
                      <div className="mb-2">
                        <a
                          href={`https://maps.google.com/?q=${message.location_lat},${message.location_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Image
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.location_lat},${message.location_lng}&zoom=15&size=300x150&markers=color:red%7C${message.location_lat},${message.location_lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt="Mappa posizione"
                            width={300}
                            height={150}
                            className="rounded-lg max-w-full"
                            onError={() => {
                              // Fallback handled by parent
                            }}
                          />
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>Apri in Google Maps</span>
                          </div>
                        </a>
                      </div>
                    )}

                    {/* Audio Message */}
                    {message.type === 'audio' && message.media_url && (
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleAudio(message.media_url!)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
                        >
                          {playingAudio === message.media_url ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white/60 w-1/3 rounded-full" />
                          </div>
                        </div>
                        <span className="text-xs">
                          {formatDuration(message.duration || 0)}
                        </span>
                      </div>
                    )}

                    {/* Text Content */}
                    {message.content && (
                      <p className="text-sm">{message.content}</p>
                    )}
                    
                    <p
                      className={`mt-1 text-right text-xs ${
                        isMine ? "text-white/70" : "text-white/40"
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mobile Navigation Buttons */}
      {booking && (
        <div className="sm:hidden border-t border-white/10 bg-[#12121e] px-4 py-2">
          <NavigationButtons 
            destination={booking.rides.to_city}
            label={booking.rides.to_city}
            variant="compact"
          />
        </div>
      )}

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
                className="flex-1 py-3 rounded-xl bg-[#e63946] text-white font-medium hover:bg-[#c92a37] disabled:opacity-50"
              >
                {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Invia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
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

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-white/10 bg-[#12121e] px-4 py-4"
      >
        {/* Recording Indicator */}
        {isRecording && (
          <div className="mx-auto max-w-4xl mb-3 flex items-center justify-between bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-medium">Registrazione in corso...</span>
            </div>
            <span className="text-red-400 font-mono">{formatDuration(recordingTime)}</span>
          </div>
        )}

        <div className="mx-auto max-w-4xl flex items-center gap-2">
          {/* Image Upload Button */}
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
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {/* Location Button */}
          <button
            type="button"
            onClick={sendLocation}
            disabled={isRecording}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            <MapPin className="h-5 w-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isRecording ? "Registrazione in corso..." : "Scrivi un messaggio..."}
            disabled={isRecording}
            className="flex-1 rounded-xl border border-white/10 bg-[#1e2a4a] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] disabled:opacity-50"
          />

          {/* Voice/Message Button */}
          {newMessage.trim() ? (
            <button
              type="submit"
              disabled={sending}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e63946] text-white transition-all hover:bg-[#c92a37] disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseLeave={isRecording ? stopRecording : undefined}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                isRecording 
                  ? "bg-red-500 text-white" 
                  : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
              }`}
            >
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
