"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Send, 
  Loader2,
  AlertCircle,
  User
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notifyNewMessage } from "@/lib/notifications";
import { NavigationButtons } from "@/components/NavigationButtons";
import toast from "react-hot-toast";

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
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
  
  const [user, setUser] = useState<any>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom of messages
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

      // Check auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);

      // Load booking with ride and passenger details
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

      // Check if user is part of this booking (driver or passenger)
      const isDriver = bookingData.rides.driver_id === currentUser.id;
      const isPassenger = bookingData.passenger_id === currentUser.id;
      
      if (!isDriver && !isPassenger) {
        setError("Non hai accesso a questa chat.");
        setLoading(false);
        return;
      }

      setBooking(bookingData);

      // Load messages
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

  // Real-time subscription for new messages
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
          // Fetch the complete message with sender info
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending || !booking) return;

    setSending(true);

    const { error: sendError } = await supabase
      .from("messages")
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        content: newMessage.trim(),
        read: false,
      });

    if (sendError) {
      console.error("Error sending message:", sendError);
      toast.error("Errore nell'invio del messaggio");
    } else {
      setNewMessage("");
      
      // Notify the other party
      const isDriver = user.id === booking.rides.driver_id;
      const recipientId = isDriver ? booking.passenger_id : booking.rides.driver_id;
      const senderName = user.user_metadata?.name || user.email?.split("@")[0] || "Utente";
      
      await notifyNewMessage(
        recipientId,
        senderName,
        booking.ride_id,
        booking.id
      );
    }

    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
                  <img
                    src={otherParticipant.avatar_url}
                    alt={otherParticipant.name}
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
          
          {/* Navigation Buttons */}
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
                    <p className="text-sm">{message.content}</p>
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

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-white/10 bg-[#12121e] px-4 py-4"
      >
        <div className="mx-auto flex max-w-4xl gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 rounded-xl border border-white/10 bg-[#1e2a4a] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e63946] text-white transition-all hover:bg-[#c92a37] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
