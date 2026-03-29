"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, MapPin, Calendar, Clock, Users, Banknote,
  MapPinned, FileText, User, Star, Loader2, AlertCircle,
  Check, MessageCircle, Share2, Copy, CheckCircle2, Route, Car
} from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
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

// Star Rating Display Component
function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-white/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rideId = params.id as string;
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similarRides, setSimilarRides] = useState<Ride[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [existingBooking, setExistingBooking] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchRide = async () => {
      if (!rideId) return;
      setLoading(true);

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch ride
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

        // Fetch driver's reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select(`
            *,
            reviewer:profiles(name, avatar_url)
          `)
          .eq("reviewed_id", data.driver_id)
          .order("created_at", { ascending: false })
          .limit(3);
        
        setReviews(reviewsData || []);

        // Fetch similar rides
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
      year: "numeric"
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

      // Notify driver
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
      <div className="min-h-screen bg-[#1a1a2e] pt-20 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#e63946]" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] pt-20 flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-20 w-20 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white">Passaggio non trovato</h1>
        <Link href="/cerca" className="mt-6 flex items-center gap-2 text-[#e63946]">
          <ArrowLeft className="h-4 w-4" /> Torna alla ricerca
        </Link>
      </div>
    );
  }

  const isMyRide = user?.id === ride.driver_id;

  return (
    <div className="min-h-screen bg-[#1a1a2e] pt-20 pb-12">
      {/* Header */}
      <div className="bg-[#12121e] border-b border-white/10 px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/cerca" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Torna ai risultati</span>
          </Link>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copiato!" : "Condividi"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e63946] to-[#c92a37] p-8 text-white">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white" />
              </div>
              
              <div className="relative">
                <div className="mb-6 flex items-center gap-2 text-white/80">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">{formatDate(ride.date)}</span>
                  <span className="mx-2">•</span>
                  <Clock className="h-5 w-5" />
                  <span>{ride.time.slice(0, 5)}</span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold">{ride.from_city}</p>
                    <p className="mt-1 text-sm text-white/70">Partenza</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="h-0.5 flex-1 bg-white/30" />
                    <Car className="h-6 w-6 text-white/70" />
                    <div className="h-0.5 flex-1 bg-white/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{ride.to_city}</p>
                    <p className="mt-1 text-sm text-white/70">Arrivo</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{ride.price === 0 ? "Gratis" : `${ride.price}€`}</p>
                    <p className="text-xs text-white/70">{ride.price === 0 ? "Contributo" : "a persona"}</p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">{ride.seats}</p>
                    <p className="text-xs text-white/70">Posti liberi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {ride.meeting_point && (
                <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-5">
                  <div className="flex items-center gap-3 text-[#e63946]">
                    <MapPinned className="h-5 w-5" />
                    <span className="font-medium">Punto di ritrovo</span>
                  </div>
                  <p className="mt-3 text-white">{ride.meeting_point}</p>
                </div>
              )}
              
              {ride.notes && (
                <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-5">
                  <div className="flex items-center gap-3 text-[#e63946]">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Note</span>
                  </div>
                  <p className="mt-3 text-white">{ride.notes}</p>
                </div>
              )}
            </div>

            {/* Driver Reviews Section */}
            {reviews.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Recensioni recenti</h3>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946] text-sm font-bold">
                          {review.reviewer.avatar_url ? (
                            <img src={review.reviewer.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            review.reviewer.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-white">{review.reviewer.name}</p>
                            <span className="text-xs text-white/40">{formatReviewDate(review.created_at)}</span>
                          </div>
                          <div className="mt-1">
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-sm text-white/70">&ldquo;{review.comment}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Route Map */}
            <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
              <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#e63946]" />
                Percorso
              </h3>
              <RouteMap 
                fromCity={ride.from_city} 
                toCity={ride.to_city} 
                height="400px"
              />
            </div>

            {/* Similar Rides */}
            {similarRides.length > 0 && (
              <div className="pt-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Corse simili</h3>
                <div className="space-y-3">
                  {similarRides.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/corsa/${similar.id}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1e2a4a] p-4 transition-all hover:border-[#e63946]/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {similar.date === ride.date ? "Stesso giorno" : new Date(similar.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric" })}
                            <span className="mx-2 text-white/30">•</span>
                            {similar.time.slice(0, 5)}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white/50">{similar.profiles.name}</p>
                            <StarRating rating={similar.profiles.rating} size="sm" />
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-white">
                        {similar.price === 0 ? "Gratis" : `${similar.price}€`}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Driver Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Driver Profile Card */}
              <div className="rounded-3xl border border-white/10 bg-[#1e2a4a] p-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946] ring-4 ring-[#e63946]/10">
                    {ride.profiles.avatar_url ? (
                      <img src={ride.profiles.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-12 w-12" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{ride.profiles.name}</h3>
                  <p className="text-sm text-white/50">Conducente</p>
                  
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <StarRating rating={ride.profiles.rating} size="md" />
                    <span className="ml-1 text-lg font-bold text-white">{ride.profiles.rating || 5.0}</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{ride.profiles.rides_count || 0}</p>
                    <p className="text-xs text-white/50">viaggi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{reviews.length}</p>
                    <p className="text-xs text-white/50">recensioni</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isMyRide ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-white/60">Questa è la tua corsa</p>
                  <Link href="/profilo" className="mt-2 inline-block text-sm text-[#e63946] hover:text-white">
                    Gestisci dal profilo →
                  </Link>
                </div>
              ) : existingBooking ? (
                <Link
                  href={`/chat/${existingBooking.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e63946] py-4 text-lg font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:bg-[#c92a37] hover:shadow-xl"
                >
                  <MessageCircle className="h-5 w-5" />
                  Apri chat
                </Link>
              ) : (
                <button
                  onClick={handleRequestRide}
                  disabled={requesting}
                  className="w-full rounded-2xl bg-[#e63946] py-4 text-lg font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:bg-[#c92a37] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requesting ? "Prenotazione..." : "Richiedi passaggio"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1e2a4a] p-6">
            <h3 className="mb-2 text-xl font-bold text-white">Accedi per prenotare</h3>
            <p className="mb-6 text-white/60">Devi essere autenticato per richiedere un passaggio.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white"
              >
                Annulla
              </button>
              <button
                onClick={signInWithGoogle}
                className="flex-1 rounded-xl bg-[#e63946] py-3 text-sm font-semibold text-white"
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
