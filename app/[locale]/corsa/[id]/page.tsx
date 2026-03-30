"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, MapPin, Calendar, Clock,
  User, Star, Loader2, AlertCircle,
  MessageCircle, Share2, CheckCircle2, Car,
  MapPinned, FileText, ChevronLeft
} from "lucide-react";
import Image from "next/image";
import { RouteMap } from "@/components/RouteMap";
import { WeatherWidget } from "@/components/WeatherWidget";
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
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
    rides_count: number;
  };
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
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
              : "text-muted"
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similarRides, setSimilarRides] = useState<Ride[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);

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
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-background pt-20 flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Passaggio non trovato</h1>
        <Link href="/cerca" className="mt-6 flex items-center gap-2 text-accent">
          <ArrowLeft className="h-4 w-4" /> Torna alla ricerca
        </Link>
      </div>
    );
  }

  const isMyRide = user?.id === ride.driver_id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/cerca" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Indietro</span>
          </Link>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copiato" : "Condividi"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Header - Large Typography */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                {ride.from_city} <span className="text-muted-foreground">→</span> {ride.to_city}
              </h1>
              
              {/* Date/Time/Seats Row */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">{formatDate(ride.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{ride.time.slice(0, 5)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>{ride.seats} posti</span>
                </div>
              </div>
            </div>

            {/* Driver Section */}
            <div className="flex items-center gap-4 py-4 border-y border-border">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted overflow-hidden">
                {ride.profiles.avatar_url ? (
                  <Image src={ride.profiles.avatar_url} alt="" width={48} height={48} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{ride.profiles.name}</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={ride.profiles.rating} size="sm" />
                  <span className="text-sm text-muted-foreground">{ride.profiles.rides_count || 0} viaggi</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-accent">
                  {ride.price === 0 ? "Gratis" : `${ride.price}€`}
                </p>
              </div>
            </div>

            {/* Details List */}
            {(ride.meeting_point || ride.notes) && (
              <div className="space-y-4">
                {ride.meeting_point && (
                  <div className="flex gap-3">
                    <MapPinned className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Punto di ritrovo</p>
                      <p className="text-muted-foreground">{ride.meeting_point}</p>
                    </div>
                  </div>
                )}
                
                {ride.notes && (
                  <div className="flex gap-3">
                    <FileText className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Note</p>
                      <p className="text-muted-foreground">{ride.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Map */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <RouteMap 
                fromCity={ride.from_city} 
                toCity={ride.to_city} 
                height="300px"
              />
            </div>

            {/* Weather */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <WeatherWidget 
                city={ride.from_city} 
                date={ride.date}
                variant="compact"
              />
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recensioni recenti</h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                          {review.reviewer.avatar_url ? (
                            <Image src={review.reviewer.avatar_url} alt="" width={40} height={40} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            review.reviewer.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{review.reviewer.name}</p>
                            <span className="text-xs text-muted-foreground">{formatReviewDate(review.created_at)}</span>
                          </div>
                          <div className="mt-1">
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-sm text-muted-foreground">&ldquo;{review.comment}&rdquo;</p>
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
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Corse simili</h3>
                <div className="space-y-3">
                  {similarRides.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/corsa/${similar.id}`}
                      className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Calendar className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {similar.date === ride.date ? "Stesso giorno" : new Date(similar.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric" })}
                            <span className="mx-2 text-muted-foreground">•</span>
                            {similar.time.slice(0, 5)}
                          </p>
                          <p className="text-sm text-muted-foreground">{similar.profiles.name}</p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground">
                        {similar.price === 0 ? "Gratis" : `${similar.price}€`}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Sticky Action */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Action Button */}
              {isMyRide ? (
                <div className="rounded-2xl border border-border bg-card p-4 text-center">
                  <p className="text-muted-foreground">Questa è la tua corsa</p>
                  <Link href="/profilo" className="mt-2 inline-block text-sm text-accent hover:underline">
                    Gestisci dal profilo →
                  </Link>
                </div>
              ) : existingBooking ? (
                <Link
                  href={`/chat/${existingBooking.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-lg font-semibold text-white transition-colors hover:bg-accent/90"
                >
                  <MessageCircle className="h-5 w-5" />
                  Apri chat
                </Link>
              ) : (
                <button
                  onClick={handleRequestRide}
                  disabled={requesting}
                  className="w-full rounded-2xl bg-accent py-4 text-lg font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requesting ? "Prenotazione..." : "Richiedi passaggio"}
                </button>
              )}

              {/* Mobile: Fixed bottom button */}
              <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50">
                {isMyRide ? (
                  <Link
                    href="/profilo"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-muted py-4 text-lg font-semibold text-foreground"
                  >
                    Gestisci dal profilo
                  </Link>
                ) : existingBooking ? (
                  <Link
                    href={`/chat/${existingBooking.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-lg font-semibold text-white"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Apri chat
                  </Link>
                ) : (
                  <button
                    onClick={handleRequestRide}
                    disabled={requesting}
                    className="w-full rounded-2xl bg-accent py-4 text-lg font-semibold text-white disabled:opacity-50"
                  >
                    {requesting ? "Prenotazione..." : "Richiedi passaggio"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-2 text-xl font-bold text-foreground">Accedi per prenotare</h3>
            <p className="mb-6 text-muted-foreground">Devi essere autenticato per richiedere un passaggio.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 rounded-xl border border-border bg-muted py-3 text-sm font-semibold text-foreground"
              >
                Annulla
              </button>
              <button
                onClick={signInWithGoogle}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-white"
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
