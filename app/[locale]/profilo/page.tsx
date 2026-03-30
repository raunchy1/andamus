"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { 
  User, Car, Star, LogOut, MapPin, Loader2,
  Armchair, Clock, MessageCircle, PlusCircle, Search, 
  Shield, Check, X, BadgeCheck, Zap,
  Route, Leaf, Users, BarChart3, ChevronRight
} from "lucide-react";
import { ReportUser } from "@/components/ReportUser";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { RatingModal } from "@/components/RatingModal";
import { notifyBookingAccepted, notifyBookingRejected } from "@/lib/notifications";
import { getDistanceBetweenCities, calculateCO2Saved } from "@/lib/sardinia-cities";
import { BadgeDisplay, PointsInfo } from "@/components/BadgeDisplay";
import { getLevelInfo, completeGamificationAction } from "@/lib/gamification";

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  level: string;
  rating: number;
}

interface Ride {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  status: string;
  bookings_count?: number;
}

interface Booking {
  id: string;
  ride_id: string;
  status: string;
  rides: {
    id: string;
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
    driver_id: string;
    profiles: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  };
  passenger?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    name: string;
    avatar_url: string | null;
  };
  rides: {
    from_city: string;
    to_city: string;
  };
}

interface BookingRequest {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
  created_at: string;
  passenger: {
    name: string;
    avatar_url: string | null;
  };
  ride: {
    from_city: string;
    to_city: string;
    date: string;
    time: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rides");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRideId, setRatingRideId] = useState<string>("");
  const [ratingUser, setRatingUser] = useState<{ id: string; name: string; avatar_url: string | null }>({ id: "", name: "", avatar_url: null });

  const supabase = createClient();

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push("/");
        return;
      }
      
      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      
      setProfile(profileData);

      const { data: ridesData } = await supabase
        .from("rides")
        .select(`*, bookings(count)`)
        .eq("driver_id", currentUser.id)
        .order("date", { ascending: false });
      
      setMyRides(ridesData || []);

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          rides(
            id, from_city, to_city, date, time, price, driver_id,
            profiles(id, name, avatar_url)
          )
        `)
        .eq("passenger_id", currentUser.id)
        .order("created_at", { ascending: false });
      
      setMyBookings(bookingsData || []);

      const { data: requestsData } = await supabase
        .from("bookings")
        .select(`
          *,
          passenger:profiles(name, avatar_url),
          ride:rides(from_city, to_city, date, time)
        `)
        .eq("status", "pending")
        .in("ride_id", ridesData?.map(r => r.id) || []);
      
      setBookingRequests(requestsData || []);

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:profiles(name, avatar_url),
          rides(from_city, to_city)
        `)
        .eq("reviewed_id", currentUser.id)
        .order("created_at", { ascending: false });
      
      setReviews(reviewsData || []);
      setLoading(false);
    };

    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.push("/");
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleAcceptBooking = async (request: BookingRequest) => {
    setProcessingBooking(request.id);
    
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", request.id);

      if (error) throw error;

      await notifyBookingAccepted(
        request.passenger_id,
        profile?.name || "Conducente",
        request.ride_id,
        request.id
      );

      await completeGamificationAction(
        request.passenger_id,
        'booking_confirmed'
      );

      setBookingRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast.success("Prenotazione accettata!");
    } catch {
      toast.error("Errore nell'accettare la prenotazione");
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleRejectBooking = async (request: BookingRequest) => {
    setProcessingBooking(request.id);
    
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "rejected" })
        .eq("id", request.id);

      if (error) throw error;

      await notifyBookingRejected(
        request.passenger_id,
        profile?.name || "Conducente",
        request.ride_id,
        request.id
      );

      setBookingRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast.success("Prenotazione rifiutata");
    } catch {
      toast.error("Errore nel rifiutare la prenotazione");
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logout effettuato");
    } catch {
      toast.error("Errore durante il logout");
    }
  };

  const openRatingModal = (rideId: string, userToRate: { id: string; name: string; avatar_url: string | null }) => {
    setRatingRideId(rideId);
    setRatingUser(userToRate);
    setShowRatingModal(true);
  };

  const getUserName = () => {
    if (!user) return "";
    return profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente";
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", { 
      weekday: "short", day: "numeric", month: "short" 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-green-500";
      case "pending": return "text-yellow-500";
      case "rejected": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confermato";
      case "pending": return "In attesa";
      case "rejected": return "Rifiutato";
      default: return status;
    }
  };

  const isRideCompleted = (rideDate: string) => {
    return new Date(rideDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  // Calculate stats
  const completedRides = myRides.filter(r => r.status === 'active' || new Date(r.date) < new Date());
  const completedBookings = myBookings.filter(b => b.status === 'confirmed');
  let totalKm = 0;
  let passengersHelped = 0;
  
  completedRides.forEach(ride => {
    const dist = getDistanceBetweenCities(ride.from_city, ride.to_city);
    if (dist) {
      totalKm += dist;
      passengersHelped += (ride.bookings_count || 0);
    }
  });
  
  completedBookings.forEach(booking => {
    const dist = getDistanceBetweenCities(booking.rides.from_city, booking.rides.to_city);
    if (dist) totalKm += dist;
  });
  
  const co2Saved = calculateCO2Saved(totalKm, passengersHelped);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted overflow-hidden flex-shrink-0">
              {getUserAvatar() ? (
                <Image src={getUserAvatar()!} alt="" width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{getUserName()}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{profile?.rating || 5.0}</span>
                  <span className="text-muted-foreground">({reviews.length})</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{myRides.length} corse</span>
                {profile?.level && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm font-medium text-accent">{profile.level}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{Math.round(totalKm)}</p>
              <p className="text-xs text-muted-foreground">km percorsi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{co2Saved.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">kg CO₂ risparmiata</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{passengersHelped}</p>
              <p className="text-xs text-muted-foreground">persone aiutate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{myRides.length}</p>
              <p className="text-xs text-muted-foreground">corse offerte</p>
            </div>
          </div>
        </div>
      </div>

      {/* Level & Points */}
      {profile && (
        <div className="border-b border-border px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Livello attuale</p>
                <p className="font-semibold text-foreground">
                  {getLevelInfo(profile?.points || 0).current.emoji} {profile.level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Punti</p>
                <p className="font-bold text-accent">{profile.points}</p>
              </div>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-accent rounded-full"
                style={{ width: `${(() => {
                  const levelInfo = getLevelInfo(profile.points);
                  const range = levelInfo.next ? levelInfo.next.min - levelInfo.current.min : 100;
                  const progress = profile.points - levelInfo.current.min;
                  return Math.min(100, Math.max(0, (progress / range) * 100));
                })()}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {(() => {
                const levelInfo = getLevelInfo(profile.points);
                if (levelInfo.next) {
                  return `${levelInfo.next.min - profile.points} punti al prossimo livello`;
                }
                return "Hai raggiunto il livello massimo!";
              })()}
            </p>
          </div>
        </div>
      )}

      {/* Booking Requests */}
      {bookingRequests.length > 0 && (
        <div className="border-b border-border px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Richieste in attesa ({bookingRequests.length})
            </h3>
            <div className="space-y-3">
              {bookingRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {request.passenger.avatar_url ? (
                          <Image src={request.passenger.avatar_url} alt="" width={40} height={40} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{request.passenger.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.ride.from_city} → {request.ride.to_city}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(request.ride.date)} alle {request.ride.time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:ml-auto">
                      <button
                        onClick={() => handleRejectBooking(request)}
                        disabled={processingBooking === request.id}
                        className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Rifiuta
                      </button>
                      <button
                        onClick={() => handleAcceptBooking(request)}
                        disabled={processingBooking === request.id}
                        className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                      >
                        {processingBooking === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Accetta
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Content */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Tabs - Underline Style */}
          <div className="mb-6 border-b border-border">
            <div className="flex gap-6">
              {[
                { id: "rides", label: "Le mie corse", count: myRides.length },
                { id: "bookings", label: "I miei passaggi", count: myBookings.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label} ({tab.count})
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* My Rides */}
          {activeTab === "rides" && (
            <div>
              {myRides.length === 0 ? (
                <div className="py-16 text-center">
                  <Car className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium text-foreground">Non hai ancora offerto nessun passaggio</p>
                  <p className="mt-1 text-sm text-muted-foreground">Inizia aiutando qualcuno a spostarsi!</p>
                  <Link
                    href="/offri"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white hover:bg-accent/90"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Offri un passaggio
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {myRides.map((ride) => (
                    <Link
                      key={ride.id}
                      href={`/corsa/${ride.id}`}
                      className="flex items-center justify-between py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-accent">{formatDate(ride.date)}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{ride.time.slice(0, 5)}</span>
                          {isRideCompleted(ride.date) && (
                            <span className="text-xs text-green-500">Completata</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground">
                          {ride.from_city} → {ride.to_city}
                        </h3>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {ride.seats} posti
                          {(ride.bookings_count || 0) > 0 && (
                            <span> • {ride.bookings_count} richieste</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-foreground">
                          {ride.price === 0 ? "Gratis" : `${ride.price}€`}
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Bookings */}
          {activeTab === "bookings" && (
            <div>
              {myBookings.length === 0 ? (
                <div className="py-16 text-center">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium text-foreground">Non hai ancora prenotato nessun passaggio</p>
                  <p className="mt-1 text-sm text-muted-foreground">Trova la corsa perfetta per te!</p>
                  <Link
                    href="/cerca"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white hover:bg-accent/90"
                  >
                    <Search className="h-5 w-5" />
                    Cerca passaggio
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {myBookings.map((booking) => {
                    const completed = isRideCompleted(booking.rides.date);
                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between py-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{formatDate(booking.rides.date)}</span>
                            {completed && (
                              <span className="text-xs text-green-500">Completata</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {booking.rides.from_city} → {booking.rides.to_city}
                          </h3>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {booking.rides.time.slice(0, 5)} • {booking.rides.profiles.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">
                            {booking.rides.price === 0 ? "Gratis" : `${booking.rides.price}€`}
                          </span>
                          {completed ? (
                            <button
                              onClick={() => openRatingModal(booking.rides.id, {
                                id: booking.rides.profiles.id,
                                name: booking.rides.profiles.name,
                                avatar_url: booking.rides.profiles.avatar_url
                              })}
                              className="flex items-center gap-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400"
                            >
                              <Star className="h-4 w-4" />
                              Recensisci
                            </button>
                          ) : (
                            <Link
                              href={`/chat/${booking.id}`}
                              className="flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Chat
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <LogOut className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Vuoi uscire?</h3>
            <p className="mb-6 text-muted-foreground">Dovrai accedere nuovamente per utilizzare l&apos;app.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-border bg-muted py-3 text-sm font-semibold text-foreground"
              >
                Annulla
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-white"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        rideId={ratingRideId}
        reviewedUser={ratingUser}
        currentUserId={user?.id || ""}
        onSuccess={() => {
          supabase
            .from("reviews")
            .select(`*, reviewer:profiles(name, avatar_url), rides(from_city, to_city)`)
            .eq("reviewed_id", user?.id)
            .order("created_at", { ascending: false })
            .then(({ data }) => setReviews(data || []));
        }}
      />
    </div>
  );
}
