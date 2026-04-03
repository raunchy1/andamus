"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { Loader2, Check, X, Trash2, ChevronRight, MessageCircle, Star, User, LogOut, Car, Route, Leaf, Bell, Repeat, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { RatingModal } from "@/components/RatingModal";
import { notifyBookingAccepted, notifyBookingRejected } from "@/lib/notifications";
import { getDistanceBetweenCities, calculateCO2Saved } from "@/lib/sardinia-cities";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { PhoneVerification } from "@/components/PhoneVerification";
import { getLevelInfo, completeGamificationAction } from "@/lib/gamification";
import { useDeviceType } from "@/components/view-mode";
import { EmptyState, EmptyStateProfile } from "@/components/EmptyState";
import { ShareApp } from "@/components/ShareApp";

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  level: string;
  rating: number;
  phone_verified?: boolean;
  phone?: string | null;
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
  smoking_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  large_luggage?: boolean | null;
  music_preference?: "quiet" | "music" | "talk" | null;
  women_only?: boolean | null;
  students_only?: boolean | null;
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

interface RideAlert {
  id: string;
  from_city: string;
  to_city: string;
  start_date: string | null;
  end_date: string | null;
  min_seats: number | null;
  max_price: number | null;
  created_at: string;
}

interface RideTemplate {
  id: string;
  from_city: string;
  to_city: string;
  time: string;
  seats: number;
  price: number;
  recurrence_days: number[];
  is_active: boolean;
  created_at: string;
}

interface RideRequestItem {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string | null;
  seats_needed: number;
  max_price: number | null;
  status: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [rideAlerts, setRideAlerts] = useState<RideAlert[]>([]);
  const [rideTemplates, setRideTemplates] = useState<RideTemplate[]>([]);
  const [myRequests, setMyRequests] = useState<RideRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rides");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRideId, setRatingRideId] = useState<string>("");
  const [ratingUser, setRatingUser] = useState<{ id: string; name: string; avatar_url: string | null }>({ id: "", name: "", avatar_url: null });
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const supabase = createClient();

  const deviceType = useDeviceType();

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

      const { data: alertsData } = await supabase
        .from("ride_alerts")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });
      
      setRideAlerts(alertsData || []);

      // Silently handle missing ride_templates table (beta feature)
      try {
        const { data: templatesData } = await supabase
          .from("ride_templates")
          .select("id, from_city, to_city, time, seats, price, recurrence_days, is_active, created_at")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });
        
        setRideTemplates(templatesData || []);
      } catch {
        setRideTemplates([]);
      }

      const { data: myRequestsData } = await supabase
        .from("ride_requests")
        .select("id, from_city, to_city, date, time, seats_needed, max_price, status, created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });
      
      setMyRequests(myRequestsData || []);
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

  const handleCancelBooking = async () => {
    if (!cancelBookingId || !cancelReason.trim()) return;
    const { error } = await supabase
      .from("bookings")
      .update({ status: "canceled" })
      .eq("id", cancelBookingId);
    if (error) {
      toast.error("Errore nell'annullamento");
      return;
    }
    await supabase.from("booking_cancellations").insert({
      booking_id: cancelBookingId,
      canceled_by: user?.id,
      reason: cancelReason.trim(),
    });
    setMyBookings((prev) =>
      prev.map((b) => (b.id === cancelBookingId ? { ...b, status: "canceled" } : b))
    );
    toast.success("Prenotazione annullata");
    setCancelBookingId(null);
    setCancelReason("");
  };

  const handleDeleteAlert = async (alertId: string) => {
    const { error } = await supabase.from("ride_alerts").delete().eq("id", alertId);
    if (error) {
      toast.error("Errore nell'eliminazione dell'alerta");
    } else {
      setRideAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alerta eliminata");
    }
  };

  const handleToggleTemplate = async (template: RideTemplate) => {
    const { error } = await supabase
      .from("ride_templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id);
    if (error) {
      toast.error("Errore nell'aggiornamento");
    } else {
      setRideTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, is_active: !template.is_active } : t))
      );
      toast.success(!template.is_active ? "Template attivato" : "Template disattivato");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const { error } = await supabase.from("ride_templates").delete().eq("id", templateId);
    if (error) {
      toast.error("Errore nell'eliminazione del template");
    } else {
      setRideTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast.success("Template eliminato");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    const { error } = await supabase.from("ride_requests").delete().eq("id", requestId);
    if (error) {
      toast.error("Errore nell'eliminazione della richiesta");
    } else {
      setMyRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Richiesta eliminata");
    }
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
      case "confirmed": return "text-tertiary";
      case "pending": return "text-primary";
      case "rejected": return "text-error";
      case "canceled": return "text-error";
      default: return "text-on-surface-variant";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confermato";
      case "pending": return "In attesa";
      case "rejected": return "Rifiutato";
      case "canceled": return "Annullato";
      default: return status;
    }
  };

  const isRideCompleted = (rideDate: string) => {
    return new Date(rideDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
  const levelInfo = profile ? getLevelInfo(profile.points) : null;

  function ProfileMobile() {
    return (
      <div className="min-h-screen bg-surface-container-lowest">
        <header className="bg-[#0e0e0e] text-primary flex justify-between items-end w-full px-4 sm:px-6 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/profilo" className="w-10 h-10 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/20 flex items-center justify-center">
              {getUserAvatar() ? (
                <img 
                  src={getUserAvatar()!} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { 
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }} 
                />
              ) : null}
              <div className={`w-full h-full items-center justify-center ${getUserAvatar() ? 'hidden' : 'flex'}`}>
                <User className="w-5 h-5 text-on-surface-variant" />
              </div>
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tighter text-on-surface uppercase">Andamus</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-primary p-2">
              <ShareApp variant="icon" className="text-primary" />
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200 ease-out p-2"
            >
              <LogOut className="w-8 h-8" />
            </button>
          </div>
        </header>

        <main className="max-w-md mx-auto">
          <section className="px-4 sm:px-6 py-8 flex flex-col items-center overflow-x-hidden">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="custom-ring w-full h-full absolute">
                <circle className="text-surface-container-highest" cx="80" cy="80" fill="transparent" r="74" stroke="currentColor" strokeWidth="4" />
                <circle
                  className="text-primary"
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="74"
                  stroke="currentColor"
                  strokeDasharray="465"
                  strokeDashoffset={profile ? 465 - (465 * Math.min((profile.points % 100) / 100, 1)) : 120}
                  strokeWidth="6"
                />
              </svg>
              <div className="text-center z-10">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Livello</span>
                <span className="text-4xl font-extrabold tracking-tighter text-on-surface">{profile?.level?.split(" ")[0] || "Novice"}</span>
              </div>
              <div className="absolute -bottom-2 bg-primary text-on-primary px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl">
                {profile?.level || "Member"}
              </div>
            </div>
            <div className="mt-8 text-center">
              <h2 className="text-4xl font-extrabold tracking-tight mb-1 text-on-surface">{getUserName()}</h2>
              <p className="text-on-surface-variant text-sm font-medium opacity-80 uppercase tracking-widest">
                Esploratore dal {user?.created_at ? new Date(user.created_at).getFullYear() : "2022"}
              </p>
            </div>
          </section>

          <section className="px-4 sm:px-6 mb-12">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container p-4 rounded-xl flex flex-col justify-between min-h-[100px]">
                <Car className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xl font-extrabold text-on-surface">{myRides.length + myBookings.length}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Viaggi</p>
                </div>
              </div>
              <div className="bg-surface-container p-4 rounded-xl flex flex-col justify-between min-h-[100px]">
                <Route className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xl font-extrabold text-on-surface">{Math.round(totalKm / 100) / 10}k</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Km Totali</p>
                </div>
              </div>
              <div className="bg-surface-container p-4 rounded-xl flex flex-col justify-between min-h-[100px]">
                <Star className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xl font-extrabold text-on-surface">{profile?.rating || 5.0}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Rating</p>
                </div>
              </div>
              <div className="bg-surface-container p-4 rounded-xl flex flex-col justify-between min-h-[100px]">
                <Leaf className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xl font-extrabold text-on-surface">{Math.round(co2Saved)}kg</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">CO2 Salvata</p>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
            <div className="bg-surface-container p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                <Shield className="w-5 h-5 text-primary" />
                Verifica e Sicurezza
              </h3>
              
              {/* Phone Verification */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">Numero di telefono</p>
                  <p className="text-xs text-on-surface-variant">
                    {user?.phone ? user.phone : "Non verificato"}
                  </p>
                </div>
                <PhoneVerification 
                  userId={user?.id || ""}
                  currentPhone={user?.phone}
                  isVerified={profile?.phone_verified}
                  onVerified={() => {
                    // Refresh profile data
                    supabase.from("profiles")
                      .select("*")
                      .eq("id", user?.id)
                      .single()
                      .then(({ data }) => {
                        if (data) setProfile(data);
                      });
                  }}
                />
              </div>
            </div>
          </section>

          <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
            <div className="bg-surface-container p-4 rounded-xl">
              <h3 className="mb-3 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                <Bell className="w-5 h-5 text-primary" />
                Notifiche push
              </h3>
              <PushNotificationToggle />
            </div>
          </section>

          {profile && levelInfo && (
            <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
              <div className="bg-surface-container p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Livello attuale</p>
                    <p className="font-extrabold text-on-surface">{levelInfo.current.emoji} {profile.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Punti</p>
                    <p className="font-extrabold text-primary text-xl">{profile.points}</p>
                  </div>
                </div>
                <div className="relative h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    style={{ width: `${(() => {
                      const range = levelInfo.next ? levelInfo.next.min - levelInfo.current.min : 100;
                      const progress = profile.points - levelInfo.current.min;
                      return Math.min(100, Math.max(0, (progress / range) * 100));
                    })()}%` }}
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-2">
                  {levelInfo.next
                    ? `${levelInfo.next.min - profile.points} punti al prossimo livello`
                    : "Hai raggiunto il livello massimo!"}
                </p>
              </div>
            </section>
          )}

          {bookingRequests.length > 0 && (
            <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
              <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-on-surface">
                Richieste in attesa ({bookingRequests.length})
              </h3>
              <div className="space-y-3">
                {bookingRequests.map((request) => (
                  <div key={request.id} className="rounded-xl bg-surface-container p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                          {request.passenger.avatar_url ? (
                            <img src={request.passenger.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-on-surface-variant" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{request.passenger.name}</p>
                          <p className="text-sm text-on-surface-variant">
                            {request.ride.from_city} → {request.ride.to_city}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {formatDate(request.ride.date)} alle {request.ride.time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectBooking(request)}
                          disabled={processingBooking === request.id}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-highest disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Rifiuta
                        </button>
                        <button
                          onClick={() => handleAcceptBooking(request)}
                          disabled={processingBooking === request.id}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
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
            </section>
          )}

          <section className="px-4 sm:px-6 mb-6 overflow-x-hidden">
            <div className="flex border-b border-surface-container-highest overflow-x-auto no-scrollbar">
              {[
                { id: "rides", label: "Corse" },
                { id: "bookings", label: "Passaggi" },
                { id: "templates", label: "Ricorrenti" },
                { id: "alerts", label: "Alert" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest relative whitespace-nowrap ${
                    activeTab === tab.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                  } transition-colors`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="px-4 sm:px-6 space-y-4 pb-8 overflow-x-hidden">
            {activeTab === "rides" && (
              <>
                {myRides.length === 0 ? (
                  <EmptyStateProfile type="rides" />
                ) : (
                  myRides.map((ride) => (
                    <Link
                      key={ride.id}
                      href={`/corsa/${ride.id}`}
                      className="bg-surface p-5 rounded-xl flex flex-col gap-4 border-l-4 border-primary shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                            {formatDate(ride.date)} · {ride.time.slice(0, 5)}
                          </span>
                          <h3 className="text-xl font-extrabold tracking-tight text-on-surface">{ride.from_city} — {ride.to_city}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-on-surface">{ride.price === 0 ? "Gratis" : `€${ride.price}`}</span>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                            {isRideCompleted(ride.date) ? "Completata" : "Attiva"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-on-surface-variant" />
                        </div>
                        <span className="text-[11px] font-semibold text-on-surface-variant">{ride.seats} posti · {(ride.bookings_count || 0)} richieste</span>
                      </div>
                    </Link>
                  ))
                )}
              </>
            )}

            {activeTab === "bookings" && (
              <>
                {myBookings.length === 0 ? (
                  <EmptyStateProfile type="bookings" />
                ) : (
                  myBookings.map((booking) => {
                    const completed = isRideCompleted(booking.rides.date);
                    return (
                      <div key={booking.id} className="bg-surface p-5 rounded-xl flex flex-col gap-4 border-l-4 border-surface-container-highest">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${getStatusColor(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                            <h3 className="text-xl font-extrabold tracking-tight text-on-surface">{booking.rides.from_city} — {booking.rides.to_city}</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-extrabold text-on-surface">{booking.rides.price === 0 ? "Gratis" : `€${booking.rides.price}`}</span>
                            {completed && <p className="text-[10px] font-bold text-tertiary uppercase tracking-tighter">Completata</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-on-surface-variant" />
                            </div>
                            <span className="text-[11px] font-semibold text-on-surface-variant">{booking.rides.time.slice(0, 5)} · {booking.rides.profiles.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {completed ? (
                              <button
                                onClick={() => openRatingModal(booking.rides.id, {
                                  id: booking.rides.profiles.id,
                                  name: booking.rides.profiles.name,
                                  avatar_url: booking.rides.profiles.avatar_url
                                })}
                                className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5 text-sm font-bold text-primary"
                              >
                                <Star className="h-3 w-3" />
                                Recensisci
                              </button>
                            ) : (
                              <>
                                {booking.status !== "canceled" && (
                                  <>
                                    <Link href={`/chat/${booking.id}`} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-on-primary">
                                      <MessageCircle className="h-3 w-3" />
                                      Chat
                                    </Link>
                                    <button
                                      onClick={() => setCancelBookingId(booking.id)}
                                      className="flex items-center gap-1 rounded-full bg-error/20 px-3 py-1.5 text-sm font-bold text-error"
                                    >
                                      Annulla
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {activeTab === "templates" && (
              <>
                {rideTemplates.length === 0 ? (
                  <EmptyState
                    title="Nessuna corsa ricorrente"
                    description="Crea una corsa ricorrente per i tuoi viaggi abituali e risparmia tempo."
                    icon={<Repeat className="w-12 h-12 text-[#e63946]" />}
                    action={{ label: "Crea ricorrente", href: "/offri", variant: "outline" }}
                  />
                ) : (
                  rideTemplates.map((template) => (
                    <div key={template.id} className="bg-surface p-5 rounded-xl flex flex-col gap-4 border-l-4 border-surface-container-highest">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="text-xl font-extrabold tracking-tight text-on-surface">{template.from_city} — {template.to_city}</h3>
                          <p className="text-sm text-on-surface-variant mt-1">
                            {template.time.slice(0, 5)} · {template.seats} posti · {template.price === 0 ? "Gratis" : `€${template.price}`}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {template.recurrence_days.map((d) => ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"][d]).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTemplate(template)}
                            className={`rounded-full px-3 py-1.5 text-sm font-bold ${template.is_active ? 'bg-surface-container-high text-on-surface' : 'bg-primary text-on-primary'}`}
                          >
                            {template.is_active ? "Sospendi" : "Attiva"}
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 rounded-full bg-error/20 text-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "alerts" && (
              <>
                {rideAlerts.length === 0 ? (
                  <EmptyState
                    title="Nessun alert salvato"
                    description="Crea un alert per ricevere notifiche quando ci sono nuovi passaggi sulla tua tratta preferita."
                    icon={<Bell className="w-12 h-12 text-[#e63946]" />}
                    action={{ label: "Cerca e crea alert", href: "/cerca", variant: "outline" }}
                  />
                ) : (
                  rideAlerts.map((alert) => (
                    <div key={alert.id} className="bg-surface p-5 rounded-xl flex items-center justify-between border-l-4 border-surface-container-highest">
                      <div>
                        <h3 className="font-bold text-on-surface">{alert.from_city || "Qualsiasi"} → {alert.to_city || "Qualsiasi"}</h3>
                        <p className="text-sm text-on-surface-variant">
                          {alert.start_date && `Dal ${formatDate(alert.start_date)}`}
                          {alert.end_date && ` al ${formatDate(alert.end_date)}`}
                          {alert.min_seats !== null && ` · Min ${alert.min_seats} posti`}
                          {alert.max_price !== null && ` · Max ${alert.max_price}€`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-2 rounded-full bg-error/20 text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </section>
        </main>

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface-container-low p-6">
              <h3 className="text-lg font-extrabold text-on-surface mb-2">Vuoi uscire?</h3>
              <p className="text-sm text-on-surface-variant mb-6">Dovrai accedere di nuovo per usare l&apos;app.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-bold text-on-surface"
                >
                  Annulla
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-xl bg-error py-3 text-sm font-bold text-white"
                >
                  Esci
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface-container-low p-6">
              <h3 className="text-lg font-extrabold text-on-surface mb-2">Annulla prenotazione</h3>
              <p className="text-sm text-on-surface-variant mb-4">Indica il motivo dell&apos;annullamento:</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-surface-container-high rounded-xl p-3 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                placeholder="Motivo..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setCancelBookingId(null); setCancelReason(""); }}
                  className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-bold text-on-surface"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim()}
                  className="flex-1 rounded-xl bg-error py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        )}

        {showRatingModal && user && (
          <RatingModal
            isOpen={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            rideId={ratingRideId}
            reviewedUser={ratingUser}
            currentUserId={user.id}
          />
        )}
      </div>
    );
  }
  function ProfileDesktop() {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-on-surface pb-16">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <section className="flex items-center gap-10 mb-12">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="custom-ring w-full h-full absolute">
                <circle className="text-surface-container-highest" cx="96" cy="96" fill="transparent" r="90" stroke="currentColor" strokeWidth="4" />
                <circle
                  className="text-primary"
                  cx="96"
                  cy="96"
                  fill="transparent"
                  r="90"
                  stroke="currentColor"
                  strokeDasharray="565"
                  strokeDashoffset={profile ? 565 - (565 * Math.min((profile.points % 100) / 100, 1)) : 120}
                  strokeWidth="6"
                />
              </svg>
              <div className="text-center z-10">
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-1">Livello</span>
                <span className="text-5xl font-extrabold tracking-tighter text-on-surface">{profile?.level?.split(" ")[0] || "Novice"}</span>
              </div>
              <div className="absolute -bottom-2 bg-primary text-on-primary px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-xl">
                {profile?.level || "Member"}
              </div>
            </div>
            <div>
              <h2 className="text-5xl font-extrabold tracking-tight mb-2 text-on-surface">{getUserName()}</h2>
              <p className="text-on-surface-variant text-base font-medium opacity-80 uppercase tracking-widest">
                Esploratore dal {user?.created_at ? new Date(user.created_at).getFullYear() : "2022"}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between min-h-[140px]">
              <Car className="w-8 h-8 text-primary" />
              <div>
                <p className="text-3xl font-extrabold text-on-surface">{myRides.length + myBookings.length}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Viaggi</p>
              </div>
            </div>
            <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between min-h-[140px]">
              <Route className="w-8 h-8 text-primary" />
              <div>
                <p className="text-3xl font-extrabold text-on-surface">{Math.round(totalKm / 100) / 10}k</p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Km Totali</p>
              </div>
            </div>
            <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between min-h-[140px]">
              <Star className="w-8 h-8 text-primary" />
              <div>
                <p className="text-3xl font-extrabold text-on-surface">{profile?.rating || 5.0}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Rating</p>
              </div>
            </div>
            <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between min-h-[140px]">
              <Leaf className="w-8 h-8 text-primary" />
              <div>
                <p className="text-3xl font-extrabold text-on-surface">{Math.round(co2Saved)}kg</p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">CO2 Salvata</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {bookingRequests.length > 0 && (
                <section>
                  <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-on-surface">
                    Richieste in attesa ({bookingRequests.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {bookingRequests.map((request) => (
                      <div key={request.id} className="rounded-2xl bg-surface-container p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                              {request.passenger.avatar_url ? (
                                <img src={request.passenger.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-on-surface-variant" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-on-surface">{request.passenger.name}</p>
                              <p className="text-sm text-on-surface-variant">
                                {request.ride.from_city} → {request.ride.to_city}
                              </p>
                              <p className="text-xs text-on-surface-variant">
                                {formatDate(request.ride.date)} alle {request.ride.time.slice(0, 5)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleRejectBooking(request)}
                              disabled={processingBooking === request.id}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-highest disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              Rifiuta
                            </button>
                            <button
                              onClick={() => handleAcceptBooking(request)}
                              disabled={processingBooking === request.id}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
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
                </section>
              )}

              <section>
                <div className="flex border-b border-surface-container-highest overflow-x-auto no-scrollbar">
                  {[
                    { id: "rides", label: "Corse" },
                    { id: "bookings", label: "Passaggi" },
                    { id: "templates", label: "Ricorrenti" },
                    { id: "alerts", label: "Alert" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-4 px-6 text-sm font-bold uppercase tracking-widest relative whitespace-nowrap ${
                        activeTab === tab.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                      } transition-colors`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                {activeTab === "rides" && (
                  <>
                    {myRides.length === 0 ? (
                      <EmptyStateProfile type="rides" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myRides.map((ride) => (
                          <Link
                            key={ride.id}
                            href={`/corsa/${ride.id}`}
                            className="bg-surface p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-primary shadow-sm hover:scale-[1.01] transition-transform"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                                  {formatDate(ride.date)} · {ride.time.slice(0, 5)}
                                </span>
                                <h3 className="text-2xl font-extrabold tracking-tight text-on-surface">{ride.from_city} — {ride.to_city}</h3>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-extrabold text-on-surface">{ride.price === 0 ? "Gratis" : `€${ride.price}`}</span>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
                                  {isRideCompleted(ride.date) ? "Completata" : "Attiva"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-on-surface-variant" />
                              </div>
                              <span className="text-sm font-semibold text-on-surface-variant">{ride.seats} posti · {(ride.bookings_count || 0)} richieste</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "bookings" && (
                  <>
                    {myBookings.length === 0 ? (
                      <EmptyStateProfile type="bookings" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myBookings.map((booking) => {
                          const completed = isRideCompleted(booking.rides.date);
                          return (
                            <div key={booking.id} className="bg-surface p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-surface-container-highest">
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${getStatusColor(booking.status)}`}>
                                    {getStatusLabel(booking.status)}
                                  </span>
                                  <h3 className="text-2xl font-extrabold tracking-tight text-on-surface">{booking.rides.from_city} — {booking.rides.to_city}</h3>
                                </div>
                                <div className="text-right">
                                  <span className="text-2xl font-extrabold text-on-surface">{booking.rides.price === 0 ? "Gratis" : `€${booking.rides.price}`}</span>
                                  {completed && <p className="text-xs font-bold text-tertiary uppercase tracking-tighter">Completata</p>}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-on-surface-variant" />
                                  </div>
                                  <span className="text-sm font-semibold text-on-surface-variant">{booking.rides.time.slice(0, 5)} · {booking.rides.profiles.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {completed ? (
                                    <button
                                      onClick={() => openRatingModal(booking.rides.id, {
                                        id: booking.rides.profiles.id,
                                        name: booking.rides.profiles.name,
                                        avatar_url: booking.rides.profiles.avatar_url
                                      })}
                                      className="flex items-center gap-1 rounded-full bg-primary/20 px-4 py-2 text-sm font-bold text-primary"
                                    >
                                      <Star className="h-4 w-4" />
                                      Recensisci
                                    </button>
                                  ) : (
                                    <>
                                      {booking.status !== "canceled" && (
                                        <>
                                          <Link href={`/chat/${booking.id}`} className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary">
                                            <MessageCircle className="h-4 w-4" />
                                            Chat
                                          </Link>
                                          <button
                                            onClick={() => setCancelBookingId(booking.id)}
                                            className="flex items-center gap-1 rounded-full bg-error/20 px-4 py-2 text-sm font-bold text-error"
                                          >
                                            Annulla
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "templates" && (
                  <>
                    {rideTemplates.length === 0 ? (
                      <EmptyState
                        title="Nessuna corsa ricorrente"
                        description="Crea una corsa ricorrente per i tuoi viaggi abituali e risparmia tempo."
                        icon={<Repeat className="w-12 h-12 text-[#e63946]" />}
                        action={{ label: "Crea ricorrente", href: "/offri", variant: "outline" }}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rideTemplates.map((template) => (
                          <div key={template.id} className="bg-surface p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-surface-container-highest">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <h3 className="text-2xl font-extrabold tracking-tight text-on-surface">{template.from_city} — {template.to_city}</h3>
                                <p className="text-sm text-on-surface-variant mt-1">
                                  {template.time.slice(0, 5)} · {template.seats} posti · {template.price === 0 ? "Gratis" : `€${template.price}`}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  {template.recurrence_days.map((d) => ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"][d]).join(", ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleTemplate(template)}
                                  className={`rounded-full px-4 py-2 text-sm font-bold ${template.is_active ? 'bg-surface-container-high text-on-surface' : 'bg-primary text-on-primary'}`}
                                >
                                  {template.is_active ? "Sospendi" : "Attiva"}
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="p-2 rounded-full bg-error/20 text-error"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "alerts" && (
                  <>
                    {rideAlerts.length === 0 ? (
                      <EmptyState
                        title="Nessun alert salvato"
                        description="Crea un alert per ricevere notifiche quando ci sono nuovi passaggi sulla tua tratta preferita."
                        icon={<Bell className="w-12 h-12 text-[#e63946]" />}
                        action={{ label: "Cerca e crea alert", href: "/cerca", variant: "outline" }}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rideAlerts.map((alert) => (
                          <div key={alert.id} className="bg-surface p-6 rounded-2xl flex items-center justify-between border-l-4 border-surface-container-highest">
                            <div>
                              <h3 className="font-bold text-lg text-on-surface">{alert.from_city || "Qualsiasi"} → {alert.to_city || "Qualsiasi"}</h3>
                              <p className="text-sm text-on-surface-variant">
                                {alert.start_date && `Dal ${formatDate(alert.start_date)}`}
                                {alert.end_date && ` al ${formatDate(alert.end_date)}`}
                                {alert.min_seats !== null && ` · Min ${alert.min_seats} posti`}
                                {alert.max_price !== null && ` · Max ${alert.max_price}€`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-3 rounded-full bg-error/20 text-error"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            <div className="lg:col-span-1 space-y-8">
              <div className="bg-surface-container p-6 rounded-2xl">
                <h3 className="mb-4 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                  <Shield className="w-5 h-5 text-primary" />
                  Verifica e Sicurezza
                </h3>
                
                {/* Phone Verification - Desktop */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-on-surface">Numero di telefono</p>
                      <p className="text-xs text-on-surface-variant">
                        {user?.phone ? user.phone : "Non verificato"}
                      </p>
                    </div>
                  </div>
                  <PhoneVerification 
                    userId={user?.id || ""}
                    currentPhone={user?.phone}
                    isVerified={profile?.phone_verified}
                    onVerified={() => {
                      // Refresh profile data
                      supabase.from("profiles")
                        .select("*")
                        .eq("id", user?.id)
                        .single()
                        .then(({ data }) => {
                          if (data) setProfile(data);
                        });
                    }}
                  />
                </div>
              </div>

              <div className="bg-surface-container p-6 rounded-2xl">
                <h3 className="mb-4 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifiche push
                </h3>
                <PushNotificationToggle />
              </div>

              {profile && levelInfo && (
                <div className="bg-surface-container p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Livello attuale</p>
                      <p className="font-extrabold text-on-surface">{levelInfo.current.emoji} {profile.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Punti</p>
                      <p className="font-extrabold text-primary text-2xl">{profile.points}</p>
                    </div>
                  </div>
                  <div className="relative h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      style={{ width: `${(() => {
                        const range = levelInfo.next ? levelInfo.next.min - levelInfo.current.min : 100;
                        const progress = profile.points - levelInfo.current.min;
                        return Math.min(100, Math.max(0, (progress / range) * 100));
                      })()}%` }}
                    />
                  </div>
                  <p className="text-sm text-on-surface-variant mt-3">
                    {levelInfo.next
                      ? `${levelInfo.next.min - profile.points} punti al prossimo livello`
                      : "Hai raggiunto il livello massimo!"}
                  </p>
                </div>
              )}

              <ShareApp variant="card" />

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full bg-error/10 text-error rounded-2xl p-4 font-bold uppercase tracking-widest text-sm hover:bg-error/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface-container-low p-6">
              <h3 className="text-lg font-extrabold text-on-surface mb-2">Vuoi uscire?</h3>
              <p className="text-sm text-on-surface-variant mb-6">Dovrai accedere di nuovo per usare l&apos;app.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-bold text-on-surface"
                >
                  Annulla
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-xl bg-error py-3 text-sm font-bold text-white"
                >
                  Esci
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface-container-low p-6">
              <h3 className="text-lg font-extrabold text-on-surface mb-2">Annulla prenotazione</h3>
              <p className="text-sm text-on-surface-variant mb-4">Indica il motivo dell&apos;annullamento:</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-surface-container-high rounded-xl p-3 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                placeholder="Motivo..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setCancelBookingId(null); setCancelReason(""); }}
                  className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-bold text-on-surface"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim()}
                  className="flex-1 rounded-xl bg-error py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        )}

        {showRatingModal && user && (
          <RatingModal
            isOpen={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            rideId={ratingRideId}
            reviewedUser={ratingUser}
            currentUserId={user.id}
          />
        )}
      </div>
    );
  }

  return deviceType === "desktop" ? <ProfileDesktop /> : <ProfileMobile />;
}
