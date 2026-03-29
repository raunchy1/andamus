"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { 
  User, Car, Star, LogOut, MapPin, Loader2,
  Armchair, Clock, MessageCircle, PlusCircle, Search, 
  Shield, CheckCircle2, Check, X, BadgeCheck, Zap,
  Route, Leaf, Users, BarChart3
} from "lucide-react";
import { ReportUser } from "@/components/ReportUser";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { RatingModal } from "@/components/RatingModal";
import { notifyBookingAccepted, notifyBookingRejected } from "@/lib/notifications";
import { getDistanceBetweenCities, calculateCO2Saved } from "@/lib/sardinia-cities";
import { BadgeDisplay, PointsInfo, BadgeUnlockNotification } from "@/components/BadgeDisplay";
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
      await completeGamificationAction(
        request.passenger_id,
        'booking_confirmed'
      );

      // Update local state
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
      {/* Profile Header - Premium Dashboard */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#1e1a3e] to-[#2a1a3e] px-4 py-12 sm:px-6 lg:px-8">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#e63946]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* Avatar with colored ring based on level */}
            <div className="relative">
              <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5 ring-4 ${
                profile?.points && profile.points >= 1000 ? 'level-ring-platinum' :
                profile?.points && profile.points >= 600 ? 'level-ring-gold' :
                profile?.points && profile.points >= 300 ? 'level-ring-silver' :
                'level-ring-bronze'
              } transition-all duration-500`}>
                {getUserAvatar() ? (
                  <Image src={getUserAvatar()!} alt="" width={112} height={112} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <User className="h-14 w-14 text-white" />
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-400 ring-4 ring-[#1a1a2e] online-indicator">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              {/* Level badge */}
              {profile?.level && (
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-sm shadow-lg">
                  {getLevelInfo(profile?.points || 0).current.emoji}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="heading-premium text-3xl text-white">{getUserName()}</h1>
              <p className="mt-1 text-white/60">{user?.email}</p>
              
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-white">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold tabular-nums">{profile?.rating || 5.0}</span>
                  <span className="text-white/50 text-sm">({reviews.length})</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-white">
                  <Car className="h-4 w-4 text-[#e63946]" />
                  <span>{myRides.length} corse</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/20 px-3 py-1.5 text-sm text-green-300">
                  <Shield className="h-4 w-4" />
                  <span>Verificato</span>
                </div>
                {profile?.level && (
                  <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-3 py-1.5 text-sm text-white">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span>{profile.level}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/20 active:scale-95 touch-manipulation min-h-[44px]"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </button>
          </div>
        </div>
      </div>

      {/* Gamification Section - Premium Stats Cards */}
      {profile && (
        <div className="border-b border-white/10 bg-[#0f0f1a] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                
                const statCards = [
                  { icon: Route, value: totalKm, label: 'km percorsi', color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
                  { icon: Leaf, value: co2Saved, suffix: ' kg', label: 'CO₂ risparmiata', color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
                  { icon: Users, value: passengersHelped, label: 'persone aiutate', color: 'from-purple-500/20 to-purple-600/10', iconColor: 'text-purple-400' },
                  { icon: Car, value: myRides.length, label: 'corse offerte', color: 'from-[#e63946]/20 to-[#c92a37]/10', iconColor: 'text-[#e63946]' },
                ];
                
                return statCards.map((stat) => (
                  <div key={stat.label} className="card-lift relative overflow-hidden rounded-2xl bg-gradient-to-br border border-white/10 p-4" style={{ background: `linear-gradient(135deg, ${stat.color.includes('blue') ? 'rgba(59,130,246,0.1)' : stat.color.includes('green') ? 'rgba(34,197,94,0.1)' : stat.color.includes('purple') ? 'rgba(168,85,247,0.1)' : 'rgba(230,57,70,0.1)'}, transparent)` }}>
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${stat.iconColor} mb-3`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="heading-premium text-2xl text-white tabular-nums">{stat.value}{stat.suffix || ''}</p>
                    <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                  </div>
                ));
              })()}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Level & Points - With animated progress */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/50">Livello attuale</p>
                    <p className="heading-premium text-xl text-white flex items-center gap-2">
                      {getLevelInfo(profile?.points || 0).current.emoji} {profile.level}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/50">Punti</p>
                    <p className="heading-premium text-2xl gradient-text tabular-nums">{profile.points}</p>
                  </div>
                </div>
                {/* Animated progress bar */}
                <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#e63946] to-[#ff5a66] rounded-full transition-all duration-1000 ease-out progress-shimmer"
                    style={{ width: `${(() => {
                      const levelInfo = getLevelInfo(profile.points);
                      const range = levelInfo.next ? levelInfo.next.min - levelInfo.current.min : 100;
                      const progress = profile.points - levelInfo.current.min;
                      return Math.min(100, Math.max(0, (progress / range) * 100));
                    })()}%` }}
                  />
                </div>
                <p className="text-xs text-white/40 mt-2">
                  {(() => {
                    const levelInfo = getLevelInfo(profile.points);
                    if (levelInfo.next) {
                      return `${levelInfo.next.min - profile.points} punti al prossimo livello`;
                    }
                    return "Hai raggiunto il livello massimo!";
                  })()}
                </p>
              </div>
              
              {/* Points Info */}
              <PointsInfo />
            </div>
            
            {/* Badges - Premium Display */}
            <div className="mt-6 glass rounded-2xl p-6">
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
                        <Image src={review.reviewer.avatar_url} alt="" width={32} height={32} className="h-full w-full rounded-full object-cover" />
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

      {/* Quick Actions - Full width on mobile */}
      <div className="border-b border-white/10 bg-[#12121e] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:flex">
          <Link
            href="/offri"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#e63946] py-3.5 sm:py-3 text-sm font-semibold text-white shadow-lg shadow-[#e63946]/20 transition-all hover:bg-[#c92a37] active:scale-95 touch-manipulation"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Offri passaggio</span>
            <span className="sm:hidden">Offri</span>
          </Link>
          <Link
            href="/cerca"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 sm:py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-95 touch-manipulation"
          >
            <Search className="h-4 w-4" />
            Cerca
          </Link>
          <Link
            href="/verifica"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 sm:py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-95 touch-manipulation"
          >
            <BadgeCheck className="h-4 w-4" />
            Verifica
          </Link>
          <Link
            href="/statistiche"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#e63946]/20 py-3.5 sm:py-3 text-sm font-semibold text-white transition-all hover:bg-[#e63946]/30 active:scale-95 touch-manipulation"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiche</span>
            <span className="sm:hidden">Stats</span>
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
                          <Image src={request.passenger.avatar_url} alt="" width={48} height={48} className="h-full w-full rounded-full object-cover" />
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
          {/* Tabs - Scrollable on mobile */}
          <div className="mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-1 rounded-xl bg-white/5 p-1 sm:min-w-0">
              {[
                { id: "rides", label: "Le mie corse", count: myRides.length },
                { id: "bookings", label: "I miei passaggi", count: myBookings.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all whitespace-nowrap active:scale-95 touch-manipulation ${
                    activeTab === tab.id
                      ? "bg-[#e63946] text-white shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
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
