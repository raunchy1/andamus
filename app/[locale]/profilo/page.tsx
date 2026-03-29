"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  User, Car, Star, Calendar, LogOut, MapPin, Loader2,
  Armchair, Clock, MessageCircle, PlusCircle, Search, 
  Shield, CheckCircle2, Check, X, BadgeCheck, Zap,
  Route, Leaf, Users, TrendingUp, BarChart3
} from "lucide-react";
import { ReportUser } from "@/components/ReportUser";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { RatingModal } from "@/components/RatingModal";
import { notifyBookingAccepted, notifyBookingRejected } from "@/lib/notifications";
import { getDistanceBetweenCities, calculateCO2Saved } from "@/lib/sardinia-cities";
import { BadgeDisplay, LevelProgress, PointsInfo, BadgeUnlockNotification } from "@/components/BadgeDisplay";
import { getLevelInfo, completeGamificationAction } from "@/lib/gamification";

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

// Star Rating Display Component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rides");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRideId, setRatingRideId] = useState<string>("");
  const [ratingUser, setRatingUser] = useState<{ id: string; name: string; avatar_url: string | null }>({ id: "", name: "", avatar_url: null });
  
  // Gamification state
  const [newBadge, setNewBadge] = useState<string | null>(null);

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

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      
      setProfile(profileData);

      // Load my rides
      const { data: ridesData } = await supabase
        .from("rides")
        .select(`*, bookings(count)`)
        .eq("driver_id", currentUser.id)
        .order("date", { ascending: false });
      
      setMyRides(ridesData || []);

      // Load my bookings
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

      // Load booking requests for driver (pending bookings for my rides)
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

      // Load reviews received
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

      // Send notification to passenger
      await notifyBookingAccepted(
        request.passenger_id,
        profile?.name || "Conducente",
        request.ride_id,
        request.id
      );

      // Add gamification points for confirmed booking (to passenger)
      const result = await completeGamificationAction(
        request.passenger_id,
        'booking_confirmed'
      );

      // Update local state
      setBookingRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast.success("Prenotazione accettata!");
    } catch (error) {
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

      // Send notification to passenger
      await notifyBookingRejected(
        request.passenger_id,
        profile?.name || "Conducente",
        request.ride_id,
        request.id
      );

      // Update local state
      setBookingRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast.success("Prenotazione rifiutata");
    } catch (error) {
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
      case "confirmed": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-white/10 text-white/60";
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
      <div className="min-h-screen bg-[#1a1a2e] pt-20 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#e63946]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] pt-20">
      {/* Profile Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#e63946] to-[#c92a37] px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white" />
        </div>
        
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
                {getUserAvatar() ? (
                  <img src={getUserAvatar()} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <User className="h-14 w-14 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-400 ring-4 ring-[#e63946]">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white">{getUserName()}</h1>
              <p className="mt-1 text-white/80">{user?.email}</p>
              
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-white">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  <span className="font-semibold">{profile?.rating || 5.0}</span>
                  <span className="text-white/70">({reviews.length} recensioni)</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white">
                  <Car className="h-4 w-4" />
                  <span>{myRides.length} corse</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white">
                  <Shield className="h-4 w-4" />
                  <span>Verificato</span>
                </div>
                {/* Level badge */}
                {profile?.level && (
                  <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-500/30 px-4 py-1.5 text-sm text-white">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span>{getLevelInfo(profile?.points || 0).current.emoji} {profile.level}</span>
                  </div>
                )}
              </div>

              {/* Mini Stats Bar */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {(() => {
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
                    <>
                      <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-white">
                        <Route className="h-4 w-4" />
                        <span className="text-sm font-medium">{totalKm} km</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-4 py-1.5 text-green-300">
                        <Leaf className="h-4 w-4" />
                        <span className="text-sm font-medium">{co2Saved} kg CO₂</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-white">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">{passengersHelped} aiutati</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 rounded-xl bg-white/20 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/30"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </button>
          </div>
        </div>
      </div>

      {/* Gamification Section */}
      {profile && (
        <div className="border-b border-white/10 bg-[#0f0f1a] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Level & Points */}
              <LevelProgress points={profile?.points || 0} level={profile?.level || 'Viaggiatore'} />
              
              {/* Points Info */}
              <PointsInfo />
            </div>
            
            {/* Badges */}
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="text-[#e63946]">🏅</span>
                I tuoi Badge
              </h3>
              <BadgeDisplay userId={user?.id || ''} />
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="border-b border-white/10 bg-[#0f0f1a] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h3 className="mb-4 text-sm font-medium text-white/50 uppercase tracking-wider">Recensioni ricevute</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((review) => (
                <div key={review.id} className="rounded-xl border border-white/10 bg-[#1e2a4a] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946] text-sm font-bold">
                      {review.reviewer.avatar_url ? (
                        <img src={review.reviewer.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        review.reviewer.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{review.reviewer.name}</p>
                      <p className="text-xs text-white/50">{review.rides.from_city} → {review.rides.to_city}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-white">{review.rating}</span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-white/70 line-clamp-2">&ldquo;{review.comment}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-b border-white/10 bg-[#12121e] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl gap-3">
          <Link
            href="/offri"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#e63946] py-3 text-sm font-semibold text-white shadow-lg shadow-[#e63946]/20 transition-all hover:bg-[#c92a37]"
          >
            <PlusCircle className="h-4 w-4" />
            Offri passaggio
          </Link>
          <Link
            href="/cerca"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            <Search className="h-4 w-4" />
            Cerca
          </Link>
          <Link
            href="/verifica"
            className="hidden sm:flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            <BadgeCheck className="h-4 w-4" />
            Verifica
          </Link>
          <Link
            href="/statistiche"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#e63946]/20 py-3 text-sm font-semibold text-white transition-all hover:bg-[#e63946]/30"
          >
            <BarChart3 className="h-4 w-4" />
            Statistiche
          </Link>
        </div>
      </div>

      {/* Booking Requests Section - For Drivers */}
      {bookingRequests.length > 0 && (
        <div className="border-b border-white/10 bg-[#1a1a2e] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Clock className="h-5 w-5 text-yellow-400" />
              Richieste in attesa ({bookingRequests.length})
            </h3>
            <div className="space-y-3">
              {bookingRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e63946]/10 text-[#e63946]">
                        {request.passenger.avatar_url ? (
                          <img src={request.passenger.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{request.passenger.name}</p>
                        <p className="text-sm text-white/50">
                          {request.ride.from_city} → {request.ride.to_city}
                        </p>
                        <p className="text-xs text-white/40">
                          {formatDate(request.ride.date)} alle {request.ride.time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 lg:ml-auto">
                      <button
                        onClick={() => handleRejectBooking(request)}
                        disabled={processingBooking === request.id}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Rifiuta
                      </button>
                      <button
                        onClick={() => handleAcceptBooking(request)}
                        disabled={processingBooking === request.id}
                        className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-600 disabled:opacity-50"
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
          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1">
            {[
              { id: "rides", label: "Le mie corse", count: myRides.length },
              { id: "bookings", label: "I miei passaggi", count: myBookings.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#e63946] text-white shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* My Rides */}
          {activeTab === "rides" && (
            <div>
              {myRides.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-16 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e63946]/10">
                    <Car className="h-10 w-10 text-[#e63946]" />
                  </div>
                  <p className="text-xl text-white">Non hai ancora offerto nessun passaggio</p>
                  <p className="mt-2 text-white/50">Inizia aiutando qualcuno a spostarsi!</p>
                  <Link
                    href="/offri"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#c92a37]"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Offri un passaggio
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRides.map((ride) => (
                    <div
                      key={ride.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1e2a4a] p-5 transition-all hover:border-[#e63946]/30"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="rounded-full bg-[#e63946]/10 px-3 py-1 text-xs font-medium text-[#e63946]">
                              {formatDate(ride.date)}
                            </span>
                            <span className="text-white/50">•</span>
                            <span className="text-sm text-white/50">{ride.time.slice(0, 5)}</span>
                            {isRideCompleted(ride.date) && (
                              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                                Completata
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white">
                            {ride.from_city} → {ride.to_city}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Armchair className="h-4 w-4 text-[#e63946]" />
                              {ride.seats} posti
                            </span>
                            {(ride.bookings_count || 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4 text-[#e63946]" />
                                {ride.bookings_count} richieste
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold">
                            {ride.price === 0 ? (
                              <span className="text-green-400">Gratis</span>
                            ) : (
                              <span className="text-white">{ride.price}€</span>
                            )}
                          </span>
                          <Link
                            href={`/corsa/${ride.id}`}
                            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#e63946]"
                          >
                            Gestisci
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Bookings */}
          {activeTab === "bookings" && (
            <div>
              {myBookings.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-16 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e63946]/10">
                    <MapPin className="h-10 w-10 text-[#e63946]" />
                  </div>
                  <p className="text-xl text-white">Non hai ancora prenotato nessun passaggio</p>
                  <p className="mt-2 text-white/50">Trova la corsa perfetta per te!</p>
                  <Link
                    href="/cerca"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#c92a37]"
                  >
                    <Search className="h-5 w-5" />
                    Cerca passaggio
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookings.map((booking) => {
                    const completed = isRideCompleted(booking.rides.date);
                    return (
                      <div
                        key={booking.id}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1e2a4a] p-5 transition-all hover:border-[#e63946]/30"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {getStatusLabel(booking.status)}
                              </span>
                              <span className="text-white/50">•</span>
                              <span className="text-sm text-white/50">{formatDate(booking.rides.date)}</span>
                              {completed && (
                                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                                  Completata
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-white">
                              {booking.rides.from_city} → {booking.rides.to_city}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                              <Clock className="h-4 w-4 text-[#e63946]" />
                              {booking.rides.time.slice(0, 5)}
                              <span className="mx-2">•</span>
                              <User className="h-4 w-4 text-[#e63946]" />
                              {booking.rides.profiles.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold">
                              {booking.rides.price === 0 ? (
                                <span className="text-green-400">Gratis</span>
                              ) : (
                                <span className="text-white">{booking.rides.price}€</span>
                              )}
                            </span>
                            {completed ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openRatingModal(booking.rides.id, {
                                    id: booking.rides.profiles.id,
                                    name: booking.rides.profiles.name,
                                    avatar_url: booking.rides.profiles.avatar_url
                                  })}
                                  className="flex items-center gap-2 rounded-xl bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-500/30"
                                >
                                  <Star className="h-4 w-4" />
                                  Recensisci
                                </button>
                                <ReportUser
                                  reportedId={booking.rides.profiles.id}
                                  reportedName={booking.rides.profiles.name}
                                  rideId={booking.rides.id}
                                />
                              </div>
                            ) : (
                              <Link
                                href={`/chat/${booking.id}`}
                                className="flex items-center gap-2 rounded-xl bg-[#e63946] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Chat
                              </Link>
                            )}
                          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1e2a4a] p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <LogOut className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">Vuoi uscire?</h3>
            <p className="mb-6 text-white/60">Dovrai accedere nuovamente per utilizzare l&apos;app.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white"
              >
                Annulla
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
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

      {/* Badge Unlock Notification */}
      <AnimatePresence>
        {newBadge && (
          <BadgeUnlockNotification
            badgeType={newBadge}
            onClose={() => setNewBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
