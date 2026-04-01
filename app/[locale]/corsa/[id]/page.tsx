"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { notifyBookingRequest } from "@/lib/notifications";
import toast from "react-hot-toast";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    name: string;
    avatar_url: string | null;
  };
}

interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
}

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
  smoking_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  large_luggage?: boolean | null;
  music_preference?: "quiet" | "music" | "talk" | null;
  women_only?: boolean | null;
  students_only?: boolean | null;
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similarRides, setSimilarRides] = useState<Ride[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [stops, setStops] = useState<{ city: string; order_index: number }[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const fetchRide = async () => {
      if (!rideId) return;
      setLoading(true);

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const { data, error } = await supabase
          .from("rides")
          .select(`*, profiles!inner(name, avatar_url, rating, rides_count)`)
          .eq("id", rideId)
          .single();

        if (error || !data) {
          toast.error("Passaggio non trovato");
          setLoading(false);
          return;
        }

        setRide(data);

        const { data: stopsData } = await supabase
          .from("ride_stops")
          .select("city, order_index")
          .eq("ride_id", rideId)
          .order("order_index", { ascending: true });
        setStops(stopsData || []);

        const { data: reviewsData } = await supabase
          .from("reviews")
          .select(`*, reviewer:profiles(name, avatar_url)`)
          .eq("reviewed_id", data.driver_id)
          .order("created_at", { ascending: false })
          .limit(3);
        
        setReviews(reviewsData || []);

        const { data: similar } = await supabase
          .from("rides")
          .select(`*, profiles!inner(name, avatar_url, rating)`)
          .eq("from_city", data.from_city)
          .eq("status", "active")
          .neq("id", rideId)
          .gte("date", new Date().toISOString().split("T")[0])
          .limit(3);

        setSimilarRides(similar || []);

        if (currentUser) {
          const { data: bookingData } = await supabase
            .from("bookings")
            .select("*")
            .eq("ride_id", rideId)
            .eq("passenger_id", currentUser.id)
            .single();
          setExistingBooking(bookingData);
        }
      } catch {
        toast.error("Errore durante il caricamento");
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [rideId, supabase]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    
    let prefix = "";
    if (dateStr === today) prefix = "Oggi, ";
    else if (dateStr === tomorrow) prefix = "Domani, ";
    
    return prefix + date.toLocaleDateString("it-IT", { 
      weekday: "long", 
      day: "numeric", 
      month: "long",
    });
  };

  const formatReviewDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      month: "short",
      year: "numeric"
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiato negli appunti!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Errore nella copia");
    }
  };

  const handleRequestRide = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!ride) return;
    if (user.id === ride.driver_id) {
      toast.error("Non puoi prenotare la tua corsa");
      return;
    }
    if (existingBooking) {
      router.push(`/chat/${existingBooking.id}`);
      return;
    }

    setRequesting(true);

    try {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("messages").insert({
        booking_id: booking.id,
        sender_id: user.id,
        content: `Ciao! Sono interessato al passaggio da ${ride.from_city} a ${ride.to_city}.`,
        read: false,
      });

      await notifyBookingRequest(
        ride.driver_id,
        user.user_metadata?.name || user.email?.split("@")[0] || "Passeggero",
        rideId,
        booking.id
      );

      toast.success("Prenotazione effettuata!");
      router.push(`/chat/${booking.id}`);
    } catch {
      toast.error("Errore nella prenotazione");
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-error mb-4" />
        <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Passaggio non trovato</h1>
        <Link href="/cerca" className="mt-6 flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Torna alla ricerca
        </Link>
      </div>
    );
  }

  const isMyRide = user?.id === ride.driver_id;

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Top Navigation */}
      <header className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-6 pt-12">
        <button onClick={() => router.back()} className="bg-surface-container-highest/80 backdrop-blur-xl p-2 rounded-xl text-on-surface hover:opacity-80 transition-all active:scale-90">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <button onClick={handleShare} className="bg-surface-container-highest/80 backdrop-blur-xl p-2 rounded-xl text-on-surface hover:opacity-80 transition-all active:scale-90">
          <span className="material-symbols-outlined text-2xl">share</span>
        </button>
      </header>

      <main className="h-full overflow-y-auto hide-scrollbar pb-32">
        {/* Full Bleed Map Header */}
        <section className="relative h-[380px] w-full">
          <div className="absolute inset-0 bg-surface-container-low">
            <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center grayscale" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          {/* Weather Widget */}
          <div className="absolute bottom-6 left-6 flex items-center space-x-3 bg-surface-container-highest/60 backdrop-blur-md px-4 py-2 rounded-xl">
            <span className="material-symbols-outlined text-primary">sunny</span>
            <div className="flex flex-col">
              <span className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface/60">{ride.from_city}</span>
              <span className="font-headline font-bold text-lg text-on-surface leading-none">24°C</span>
            </div>
          </div>
        </section>

        {/* Route Details */}
        <div className="px-6 -mt-8 relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="font-headline font-extrabold text-4xl tracking-tighter text-on-surface mb-1">
                {ride.from_city} <span className="text-primary tracking-normal">→</span> {ride.to_city}
              </h1>
              <p className="font-label font-semibold text-[11px] uppercase tracking-[0.15em] text-primary">Partenza • {formatDate(ride.date)} · {ride.time.slice(0,5)}</p>
            </div>
            <div className="text-right">
              <span className="font-headline font-extrabold text-3xl tracking-tighter text-on-surface">
                {ride.price === 0 ? "Gratis" : `€${ride.price}`}
              </span>
              <p className="font-label font-semibold text-[10px] uppercase tracking-widest text-on-surface/40">per posto</p>
            </div>
          </div>

          {/* Driver Profile Card */}
          <div className="bg-surface-container-low p-5 rounded-xl flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {ride.profiles.avatar_url ? (
                  <Image src={ride.profiles.avatar_url} alt="" width={56} height={56} className="w-14 h-14 rounded-full object-cover grayscale" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">person</span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary rounded-full p-1 border-4 border-surface-container-low">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>verified</span>
                </div>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface leading-tight">{ride.profiles.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>star</span>
                  <span className="text-sm font-semibold text-on-surface">{ride.profiles.rating}</span>
                  <span className="text-on-surface/40 text-xs">• {ride.profiles.rides_count || 0} viaggi</span>
                </div>
              </div>
            </div>
            {existingBooking && !isMyRide && (
              <Link href={`/chat/${existingBooking.id}`} className="bg-surface-container-highest text-on-surface p-3 rounded-xl hover:bg-primary hover:text-on-primary transition-all">
                <span className="material-symbols-outlined">chat_bubble</span>
              </Link>
            )}
          </div>

          {/* Bento Style Journey Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between min-h-[140px]">
              <span className="material-symbols-outlined text-primary mb-4">meeting_room</span>
              <div>
                <p className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface/40 mb-1">Ritiro</p>
                <p className="font-body font-semibold text-on-surface text-sm">{ride.meeting_point || `Piazza centrale, ${ride.from_city}`}</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between min-h-[140px]">
              <span className="material-symbols-outlined text-primary mb-4">directions_car</span>
              <div>
                <p className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface/40 mb-1">Auto</p>
                <p className="font-body font-semibold text-on-surface text-sm">Auto del guidatore</p>
              </div>
            </div>
          </div>

          {/* The Path Indicator */}
          {stops.length > 0 && (
            <div className="mb-10 px-2">
              <h4 className="font-label font-bold text-[11px] uppercase tracking-[0.2em] text-on-surface/40 mb-6">Fermate Intermedie</h4>
              <div className="space-y-8 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-surface-container-highest" />
                <div className="flex items-center space-x-6 relative">
                  <div className="w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary z-10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="font-headline font-semibold text-on-surface">{ride.from_city}</span>
                </div>
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center space-x-6 relative">
                    <div className="w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-surface-container-highest z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
                    </div>
                    <span className="font-headline font-semibold text-on-surface/60">{stop.city}</span>
                  </div>
                ))}
                <div className="flex items-center space-x-6 relative">
                  <div className="w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary z-10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="font-headline font-semibold text-on-surface">{ride.to_city}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rules/Amenities */}
          <div className="flex flex-wrap gap-3 mb-10">
            {!ride.smoking_allowed && (
              <div className="flex items-center space-x-2 bg-surface-container-high px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">smoke_free</span>
                <span className="font-label font-bold text-[10px] uppercase">No fumo</span>
              </div>
            )}
            {ride.pets_allowed && (
              <div className="flex items-center space-x-2 bg-surface-container-high px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">pets</span>
                <span className="font-label font-bold text-[10px] uppercase">Animali ok</span>
              </div>
            )}
            {ride.large_luggage && (
              <div className="flex items-center space-x-2 bg-surface-container-high px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">luggage</span>
                <span className="font-label font-bold text-[10px] uppercase">Bagaglio grande</span>
              </div>
            )}
            {ride.women_only && (
              <div className="flex items-center space-x-2 bg-surface-container-high px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">female</span>
                <span className="font-label font-bold text-[10px] uppercase">Solo donne</span>
              </div>
            )}
            {ride.students_only && (
              <div className="flex items-center space-x-2 bg-surface-container-high px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">school</span>
                <span className="font-label font-bold text-[10px] uppercase">Solo studenti</span>
              </div>
            )}
            {ride.music_preference && (
              <div className="flex items-center space-x-2 bg-surface-container-high px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[18px]">
                  {ride.music_preference === "quiet" ? "volume_off" : ride.music_preference === "music" ? "music_note" : "chat"}
                </span>
                <span className="font-label font-bold text-[10px] uppercase">
                  {ride.music_preference === "quiet" ? "Silenzio" : ride.music_preference === "music" ? "Musica" : "Chiacchiere"}
                </span>
              </div>
            )}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="mb-10">
              <h4 className="font-label font-bold text-[11px] uppercase tracking-[0.2em] text-on-surface/40 mb-4">Recensioni</h4>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-surface-container-low p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                      {review.reviewer.avatar_url ? (
                        <Image src={review.reviewer.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-on-surface">{review.reviewer.name}</p>
                          <span className="text-xs text-on-surface-variant">{formatReviewDate(review.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`material-symbols-outlined text-[14px] ${i < review.rating ? "text-primary" : "text-surface-container-highest"}`}
                              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-sm text-on-surface-variant">&ldquo;{review.comment}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Rides */}
          {similarRides.length > 0 && (
            <div className="mb-10">
              <h4 className="font-label font-bold text-[11px] uppercase tracking-[0.2em] text-on-surface/40 mb-4">Corse simili</h4>
              <div className="space-y-3">
                {similarRides.map((similar) => (
                  <Link
                    key={similar.id}
                    href={`/corsa/${similar.id}`}
                    className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl transition-colors hover:bg-surface-container-high"
                  >
                    <div>
                      <p className="font-bold text-on-surface">{similar.from_city} → {similar.to_city}</p>
                      <p className="text-sm text-on-surface-variant">{similar.time.slice(0,5)} · {similar.profiles.name}</p>
                    </div>
                    <span className="font-extrabold text-on-surface">
                      {similar.price === 0 ? "Gratis" : `€${similar.price}`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Action Button */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface via-surface to-transparent pt-12 z-40">
        {isMyRide ? (
          <Link
            href="/profilo"
            className="w-full bg-surface-container-highest text-on-surface py-5 rounded-xl font-headline font-extrabold text-lg uppercase tracking-wider flex items-center justify-center space-x-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <span>Gestisci dal profilo</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        ) : existingBooking ? (
          <Link
            href={`/chat/${existingBooking.id}`}
            className="w-full bg-[#e63946] text-white py-5 rounded-xl font-headline font-extrabold text-lg uppercase tracking-wider flex items-center justify-center space-x-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <span>Apri chat</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        ) : (
          <button
            onClick={handleRequestRide}
            disabled={requesting}
            className="w-full bg-[#e63946] text-white py-5 rounded-xl font-headline font-extrabold text-lg uppercase tracking-wider flex items-center justify-center space-x-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-70"
          >
            <span>{requesting ? "Prenotazione..." : "Richiedi passaggio"}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-low p-6">
            <h3 className="mb-2 text-xl font-extrabold tracking-tight text-on-surface">Accedi per prenotare</h3>
            <p className="mb-6 text-on-surface-variant">Devi essere autenticato per richiedere un passaggio.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-highest"
              >
                Annulla
              </button>
              <button
                onClick={signInWithGoogle}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary hover:opacity-90"
              >
                Accedi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
