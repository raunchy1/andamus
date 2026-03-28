"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Banknote,
  MapPinned,
  FileText,
  User,
  Star,
  Loader2,
  AlertCircle,
  Check,
  MessageCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";

interface Ride {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  meeting_point: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
    rides_count: number;
  };
}

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rideId = params.id as string;
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [existingBooking, setExistingBooking] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchRide = async () => {
      if (!rideId) return;

      setLoading(true);
      setError("");

      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch ride
        const { data, error: supabaseError } = await supabase
          .from("rides")
          .select(`
            *,
            profiles!inner(name, avatar_url, rating, rides_count)
          `)
          .eq("id", rideId)
          .single();

        if (supabaseError) {
          console.error("Error fetching ride:", supabaseError);
          setError("Passaggio non trovato.");
          setLoading(false);
          return;
        }

        setRide(data);

        // Check if user already has a booking for this ride
        if (currentUser) {
          const { data: bookingData } = await supabase
            .from("bookings")
            .select("*")
            .eq("ride_id", rideId)
            .eq("passenger_id", currentUser.id)
            .single();
          
          setExistingBooking(bookingData);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Errore durante il caricamento.");
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [rideId, supabase]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('it-IT', options);
  };

  const handleRequestRide = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!ride) return;

    // Check if user is the driver
    if (user.id === ride.driver_id) {
      setError("Non puoi prenotare il tuo stesso passaggio.");
      return;
    }

    // Check if already booked
    if (existingBooking) {
      router.push(`/chat/${existingBooking.id}`);
      return;
    }

    setShowRequestModal(true);
  };

  const submitBooking = async () => {
    if (!user || !ride) return;

    setRequesting(true);

    try {
      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Error creating booking:", bookingError);
        setError("Errore durante la prenotazione. Riprova.");
        setRequesting(false);
        return;
      }

      // Send initial message
      await supabase.from("messages").insert({
        booking_id: booking.id,
        sender_id: user.id,
        content: `Ciao! Sono interessato al passaggio da ${ride.from_city} a ${ride.to_city}.`,
        read: false,
      });

      // Redirect to chat
      router.push(`/chat/${booking.id}`);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Errore imprevisto. Riprova.");
      setRequesting(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
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

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
          <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">
            {error || "Passaggio non trovato"}
          </h1>
          <Link
            href="/cerca"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#e63946] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla ricerca
          </Link>
        </div>
      </div>
    );
  }

  const isMyRide = user?.id === ride.driver_id;
  const hasBooking = !!existingBooking;

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header with back button */}
      <div className="border-b border-white/10 bg-[#12121e] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/cerca"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna ai risultati
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column - Ride details */}
            <div className="lg:col-span-2">
              {/* Route card */}
              <div className="mb-6 rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-[#e63946]" />
                      <div className="my-1 h-16 w-0.5 bg-white/20" />
                      <div className="h-4 w-4 rounded-full bg-[#e63946]" />
                    </div>
                    <div className="flex-1 space-y-8">
                      <div>
                        <p className="text-sm text-white/50">Partenza</p>
                        <p className="text-2xl font-bold text-white">{ride.from_city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/50">Destinazione</p>
                        <p className="text-2xl font-bold text-white">{ride.to_city}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ride info grid */}
                <div className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e63946]/10">
                      <Calendar className="h-5 w-5 text-[#e63946]" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Data</p>
                      <p className="text-sm font-medium text-white">{formatDate(ride.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e63946]/10">
                      <Clock className="h-5 w-5 text-[#e63946]" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Ora</p>
                      <p className="text-sm font-medium text-white">{ride.time.slice(0, 5)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e63946]/10">
                      <Users className="h-5 w-5 text-[#e63946]" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Posti</p>
                      <p className="text-sm font-medium text-white">{ride.seats} disponibili</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price and additional info */}
              <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Dettagli</h2>
                
                {/* Price */}
                <div className="mb-6 flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <Banknote className="h-5 w-5 text-[#e63946]" />
                    <span className="text-white">Contributo richiesto</span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {ride.price === 0 ? (
                      <span className="text-green-400">Gratuito</span>
                    ) : (
                      `${ride.price}€`
                    )}
                  </span>
                </div>

                {/* Meeting point */}
                {ride.meeting_point && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-white/70">
                      <MapPinned className="h-4 w-4 text-[#e63946]" />
                      <span className="text-sm font-medium">Punto di ritrovo</span>
                    </div>
                    <p className="mt-1 pl-6 text-white">{ride.meeting_point}</p>
                  </div>
                )}

                {/* Notes */}
                {ride.notes && (
                  <div>
                    <div className="flex items-center gap-2 text-white/70">
                      <FileText className="h-4 w-4 text-[#e63946]" />
                      <span className="text-sm font-medium">Note del conducente</span>
                    </div>
                    <p className="mt-1 pl-6 text-white/80">{ride.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Driver info & CTA */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Conducente</h2>
                
                {/* Driver profile */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                    {ride.profiles.avatar_url ? (
                      <img 
                        src={ride.profiles.avatar_url} 
                        alt={ride.profiles.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{ride.profiles.name || "Utente"}</p>
                    <div className="flex items-center gap-1 text-sm text-white/60">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span>{ride.profiles.rating || 5.0}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{ride.profiles.rides_count || 0}</p>
                    <p className="text-xs text-white/50">viaggi offerti</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {new Date(ride.created_at).getFullYear()}
                    </p>
                    <p className="text-xs text-white/50">membro dal</p>
                  </div>
                </div>

                {/* CTA Button */}
                {isMyRide ? (
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="text-sm text-white/60">Questo è il tuo passaggio</p>
                  </div>
                ) : hasBooking ? (
                  <Link
                    href={`/chat/${existingBooking.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e63946] py-4 text-base font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:bg-[#c92a37]"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Apri chat
                  </Link>
                ) : (
                  <button
                    onClick={handleRequestRide}
                    disabled={requesting}
                    className="w-full rounded-xl bg-[#e63946] py-4 text-base font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:bg-[#c92a37] hover:shadow-xl hover:shadow-[#e63946]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requesting ? "Prenotazione in corso..." : "Richiedi passaggio"}
                  </button>
                )}

                <p className="mt-4 text-center text-xs text-white/40">
                  {hasBooking 
                    ? "Hai già una prenotazione per questo passaggio"
                    : "Il conducente ti risponderà presto"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
            <h3 className="mb-2 text-xl font-bold text-white">
              Accedi per prenotare
            </h3>
            <p className="mb-6 text-white/60">
              Devi essere autenticato per richiedere un passaggio.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Annulla
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 rounded-xl bg-[#e63946] py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
              >
                Accedi con Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
            <h3 className="mb-2 text-xl font-bold text-white">
              Conferma prenotazione
            </h3>
            <p className="mb-6 text-white/60">
              Stai per richiedere un passaggio da {ride.from_city} a {ride.to_city}. 
              Verrai messo in contatto con il conducente tramite chat.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Annulla
              </button>
              <button
                onClick={submitBooking}
                disabled={requesting}
                className="flex-1 rounded-xl bg-[#e63946] py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37] disabled:opacity-50"
              >
                {requesting ? "Prenotazione..." : "Conferma"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a12] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-white/40">
            Fatto con <span className="text-[#e63946]">♥</span> in Sardegna
          </p>
        </div>
      </footer>
    </div>
  );
}
