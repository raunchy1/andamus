"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import Image from "next/image";
import { Loader2, Check, X, Trash2, MessageCircle, Star, User, LogOut, Car, Route, Leaf, Bell, Repeat, Shield, CreditCard, RefreshCw, Gift, Share2, Copy, Users, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { RatingModal } from "@/components/RatingModal";
import { ReferralCard } from "@/components/ReferralCard";
import dynamic from "next/dynamic";

const PostActionModal = dynamic(() => import("@/components/PostActionModal").then(m => m.PostActionModal), { ssr: false });
import { acceptBooking, rejectBooking } from "@/lib/booking-lifecycle";
import { getDistanceBetweenCities, calculateCO2Saved } from "@/lib/sardinia-cities";
import { ProductAnalytics } from "@/lib/posthog";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { PhoneVerification } from "@/components/PhoneVerification";
import { EmailPreferences } from "@/components/EmailPreferences";
import { CarInfoForm } from "@/components/CarInfoForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getLevelInfo, completeGamificationAction } from "@/lib/gamification";
import { computeTrustScore, getTrustLevel, formatAccountAge, getResponseSpeed, getCompletionRate } from "@/lib/reputation";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split("T")[0];
}
import { Haptic } from "@/lib/haptic";
import { useDeviceType } from "@/components/view-mode";
import { EmptyState, EmptyStateProfile } from "@/components/EmptyState";
import { StripeConnectBanner } from "@/components/StripeConnectBanner";
import { ShareApp } from "@/components/ShareApp";
import { AuroraBackground } from "@/components/ui/premium/aurora-background";
import { Spotlight } from "@/components/ui/premium/spotlight";
import { OrbGlow } from "@/components/ui/premium/orb-glow";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { MagneticButton } from "@/components/ui/premium/magnetic-button";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { AnimatedCounter } from "@/components/ui/premium/animated-counter";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/premium/reveal";

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  level: string;
  rating: number;
  review_count?: number | null;
  rides_count?: number | null;
  completed_rides_count?: number | null;
  created_at?: string | null;
  phone_verified?: boolean;
  email_verified?: boolean;
  id_verified?: boolean;
  driver_verified?: boolean;
  phone?: string | null;
  referral_code?: string | null;
  referrals_count?: number | null;
  referral_points_earned?: number | null;
  // Car info
  car_model?: string | null;
  car_color?: string | null;
  car_plate?: string | null;
  car_year?: number | null;
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
  payment_intent_id: string | null;
  payment_status: string | null;
  passenger: {
    name: string;
    avatar_url: string | null;
  };
  ride: {
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
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

// RideRequestItem type removed - not currently used

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [rideAlerts, setRideAlerts] = useState<RideAlert[]>([]);
  const [rideTemplates, setRideTemplates] = useState<RideTemplate[]>([]);

  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null);
  const [streakCelebrated, setStreakCelebrated] = useState(false);
  const [activeTab, setActiveTab] = useState("rides");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRideId, setRatingRideId] = useState<string>("");
  const [ratingUser, setRatingUser] = useState<{ id: string; name: string; avatar_url: string | null }>({ id: "", name: "", avatar_url: null });
  const [reviewedRides, setReviewedRides] = useState<Set<string>>(new Set());
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showPostAction, setShowPostAction] = useState(false);
  const [postActionType, setPostActionType] = useState<"review_submitted" | "streak_milestone" | "referral">("review_submitted");
  const [postActionContext, setPostActionContext] = useState<Record<string, unknown>>({});
  const [isCancelling, setIsCancelling] = useState(false);
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);
  const [togglingTemplateId, setTogglingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const [supabase] = useState(() => createClient());
  const isMountedRef = useRef(true);

  const deviceType = useDeviceType();
  const t = useTranslations("profile");
  const tl = useTranslations("levels");
  const locale = useLocale();

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        if (isMountedRef.current) router.push(`/${locale}/join`);
        return;
      }
      
      if (!isMountedRef.current) return;
      setUser(currentUser);

      // Parallelize independent queries
      const [profileRes, ridesRes, bookingsRes, alertsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", currentUser.id).single(),
        supabase.from("rides").select(`*, bookings(count)`).eq("driver_id", currentUser.id).order("date", { ascending: false }),
        supabase.from("bookings").select(`
          *,
          rides(
            id, from_city, to_city, date, time, price, driver_id,
            profiles(id, name, avatar_url)
          )
        `).eq("passenger_id", currentUser.id).order("created_at", { ascending: false }),
        supabase.from("ride_alerts").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }),
      ]);

      if (!isMountedRef.current) return;

      setProfile(profileRes.data);
      const ridesData = ridesRes.data || [];
      setMyRides(ridesData);
      setMyBookings(bookingsRes.data || []);
      setRideAlerts(alertsRes.data || []);

      // Fetch activity streak
      try {
        const { data: streakData } = await supabase
          .from("user_activity_weeks")
          .select("week_key")
          .eq("user_id", currentUser.id)
          .order("week_key", { ascending: false });

        if (streakData && streakData.length > 0) {
          const weeks = streakData.map((d: { week_key: string }) => d.week_key);
          const nowWeek = getWeekKey(new Date());
          const lastWeek = getWeekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

          let currentStreak = 0;
          const weekSet = new Set(weeks);

          if (weekSet.has(nowWeek) || weekSet.has(lastWeek)) {
            currentStreak = 1;
            const startWeek = weekSet.has(nowWeek) ? nowWeek : lastWeek;
            let checkWeek = startWeek;
            while (true) {
              const prev = new Date(new Date(checkWeek).getTime() - 7 * 24 * 60 * 60 * 1000);
              const prevKey = prev.toISOString().split("T")[0];
              if (weekSet.has(prevKey)) {
                currentStreak++;
                checkWeek = prevKey;
              } else break;
            }
          }

          let longestStreak = 1;
          let tempStreak = 1;
          const sorted = [...weeks].sort();
          for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(new Date(sorted[i]).getTime() - 7 * 24 * 60 * 60 * 1000);
            const prevKey = prev.toISOString().split("T")[0];
            if (sorted[i - 1] === prevKey) {
              tempStreak++;
              longestStreak = Math.max(longestStreak, tempStreak);
            } else {
              tempStreak = 1;
            }
          }

          setStreak({ current: currentStreak, longest: longestStreak });
        }
      } catch {
        // Streak fetch is non-critical
      }

      // Pre-populate reviewed rides from DB
      const { data: myReviews } = await supabase
        .from("reviews")
        .select("ride_id")
        .eq("reviewer_id", currentUser.id);
      if (myReviews) {
        setReviewedRides(new Set(myReviews.map((r: { ride_id: string }) => r.ride_id)));
      }

      // Requests depend on rides data — do sequentially
      if (ridesData.length > 0) {
        const { data: requestsData } = await supabase
          .from("bookings")
          .select(`
            *,
            passenger:profiles(name, avatar_url),
            ride:rides(from_city, to_city, date, time, price)
          `)
          .eq("status", "pending")
          .or("payment_status.is.null,payment_status.eq.authorized")
          .in("ride_id", ridesData.map((r: { id: string }) => r.id));
        if (isMountedRef.current) setBookingRequests(requestsData || []);
      } else {
        setBookingRequests([]);
      }

      // Silently handle missing ride_templates table (beta feature)
      try {
        const { data: templatesData } = await supabase
          .from("ride_templates")
          .select("id, from_city, to_city, time, seats, price, recurrence_days, is_active, created_at")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });
        if (isMountedRef.current) setRideTemplates(templatesData || []);
      } catch {
        if (isMountedRef.current) setRideTemplates([]);
      }

      if (isMountedRef.current) setLoading(false);
    };

    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: import("@supabase/supabase-js").AuthChangeEvent, session: import("@supabase/supabase-js").Session | null) => {
        if (!session && isMountedRef.current) router.push("/");
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase, locale]);

  // Streak milestone celebration — show once per session per milestone
  useEffect(() => {
    if (!streak || streakCelebrated) return;
    if (streak.current >= 2) {
      const milestoneKey = `streak_celebrated_${streak.current}`;
      const alreadyCelebrated = localStorage.getItem(milestoneKey);
      if (!alreadyCelebrated) {
        localStorage.setItem(milestoneKey, "true");
        setPostActionType("streak_milestone");
        setPostActionContext({ streakCount: streak.current });
        setShowPostAction(true);
        setStreakCelebrated(true);
      }
    }
  }, [streak, streakCelebrated]);

  const handleAcceptBooking = async (request: BookingRequest) => {
    Haptic.heavy();
    if (!user || !myRides.some(r => r.id === request.ride_id)) {
      toast.error(t("errorAcceptingBooking"));
      return;
    }
    setProcessingBooking(request.id);

    try {
      // For paid rides, capture the authorized payment first
      if (request.payment_intent_id) {
        const captureRes = await fetch("/api/stripe/connect/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: request.id }),
        });
        const captureData = await captureRes.json();
        if (!captureRes.ok) {
          throw new Error(captureData.error || "Payment capture failed");
        }
      }

      const result = await acceptBooking(request.id, request.ride_id);
      if (!result.success) {
        throw new Error(result.error || t("errorAcceptingBooking"));
      }

      await completeGamificationAction(
        request.passenger_id,
        'booking_confirmed'
      );

      ProductAnalytics.bookingAccepted(request.ride_id, request.id);
      setBookingRequests((prev) => prev.filter((r) => r.id !== request.id));
      Haptic.success();
      toast.success(t("bookingAccepted"));
    } catch (err) {
      Haptic.error();
      const message = err instanceof Error ? err.message : t("errorAcceptingBooking");
      toast.error(message);
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleRejectBooking = async (request: BookingRequest) => {
    Haptic.heavy();
    if (!user || !myRides.some(r => r.id === request.ride_id)) {
      toast.error(t("errorRejectingBooking"));
      return;
    }
    setProcessingBooking(request.id);

    try {
      // For paid rides, cancel the authorized payment (no charge to passenger)
      if (request.payment_intent_id) {
        const cancelRes = await fetch("/api/stripe/connect/cancel-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: request.id }),
        });
        const cancelData = await cancelRes.json();
        if (!cancelRes.ok) {
          throw new Error(cancelData.error || "Payment cancellation failed");
        }
      }

      const result = await rejectBooking(request.id, request.ride_id);
      if (!result.success) {
        throw new Error(result.error || t("errorRejectingBooking"));
      }

      ProductAnalytics.bookingRejected(request.ride_id, request.id);
      setBookingRequests((prev) => prev.filter((r) => r.id !== request.id));
      Haptic.success();
      toast.success(t("bookingRejected"));
    } catch (err) {
      Haptic.error();
      const message = err instanceof Error ? err.message : t("errorRejectingBooking");
      toast.error(message);
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success(t("logoutSuccess"));
    } catch {
      toast.error(t("logoutError"));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSaveCarInfo = async (carData: { car_model?: string | null; car_color?: string | null; car_plate?: string | null; car_year?: number | null }) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        car_model: carData.car_model,
        car_color: carData.car_color,
        car_plate: carData.car_plate,
        car_year: carData.car_year,
      })
      .eq("id", user.id);
    
    if (error) {
      toast.error(t("errorSavingCarInfo"));
    } else {
      toast.success(t("carSavedSuccess"));
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...carData } : null);
    }
  };

  const openRatingModal = (rideId: string, userToRate: { id: string; name: string; avatar_url: string | null }) => {
    setRatingRideId(rideId);
    setRatingUser(userToRate);
    setShowRatingModal(true);
  };

  const handleReviewSuccess = useCallback(() => {
    setReviewedRides(prev => new Set(prev).add(ratingRideId));
    setPostActionType("review_submitted");
    setPostActionContext({ rideId: ratingRideId });
    setShowPostAction(true);
  }, [ratingRideId]);

  const handleCancelBooking = async () => {
    if (!cancelBookingId || !cancelReason.trim()) return;
    if (!user || !myBookings.some(b => b.id === cancelBookingId)) {
      toast.error(t("errorCancelling"));
      return;
    }
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", cancelBookingId);
      if (error) {
        toast.error(t("errorCancelling"));
        return;
      }
      await supabase.from("booking_cancellations").insert({
        booking_id: cancelBookingId,
        canceled_by: user?.id,
        reason: cancelReason.trim(),
      });
      setMyBookings((prev) =>
        prev.map((b) => (b.id === cancelBookingId ? { ...b, status: "cancelled" } : b))
      );
      toast.success(t("bookingCancelled"));
      setCancelBookingId(null);
      setCancelReason("");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm(t("confirmDeleteAlert") || "Eliminare questo avviso?")) return;
    setDeletingAlertId(alertId);
    try {
      const { error } = await supabase.from("ride_alerts").delete().eq("id", alertId);
      if (error) {
        toast.error(t("errorDeletingAlert"));
      } else {
        setRideAlerts((prev) => prev.filter((a) => a.id !== alertId));
        toast.success(t("alertDeleted"));
      }
    } finally {
      setDeletingAlertId(null);
    }
  };

  const handleToggleTemplate = async (template: RideTemplate) => {
    setTogglingTemplateId(template.id);
    try {
      const { error } = await supabase
        .from("ride_templates")
        .update({ is_active: !template.is_active })
        .eq("id", template.id);
      if (error) {
        toast.error(t("errorUpdating"));
      } else {
        setRideTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? { ...t, is_active: !template.is_active } : t))
        );
        toast.success(!template.is_active ? t("templateActivated") : t("templateDeactivated"));
      }
    } finally {
      setTogglingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm(t("confirmDeleteTemplate") || "Eliminare questo template ricorrente?")) return;
    setDeletingTemplateId(templateId);
    try {
      const { error } = await supabase.from("ride_templates").delete().eq("id", templateId);
      if (error) {
        toast.error(t("errorDeletingTemplate"));
      } else {
        setRideTemplates((prev) => prev.filter((t) => t.id !== templateId));
        toast.success(t("templateDeleted"));
      }
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0 && mainRef.current && mainRef.current.scrollTop === 0) {
      const diff = e.touches[0].clientY - pullStartY;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, 80));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      Haptic.light();
      window.location.reload();
    }
    setPullStartY(0);
    setPullDistance(0);
  };

  const handleTouchCancel = () => {
    setPullStartY(0);
    setPullDistance(0);
  };

  const userName = useMemo(() => {
    if (!user) return "";
    return profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || t("user");
  }, [user, profile, t]);

  const userAvatar = useMemo(() => {
    if (!user) return null;
    return profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  }, [user, profile]);

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, { 
      weekday: "short", day: "numeric", month: "short" 
    });
  }, [locale]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-tertiary";
      case "pending": return "text-primary";
      case "rejected": return "text-error";
      case "cancelled": return "text-error";
      default: return "text-on-surface-variant";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return t("statusConfirmed");
      case "pending": return t("statusPending");
      case "rejected": return t("statusRejected");
      case "cancelled": return t("statusCancelled");
      default: return status;
    }
  };

  const isRideCompleted = (rideDate: string, rideTime?: string) => {
    const date = new Date(rideDate);
    if (rideTime) {
      const [hours, minutes] = rideTime.split(':').map(Number);
      date.setHours(hours || 0, minutes || 0, 0, 0);
    }
    return date < new Date();
  };

  const { completedRides, completedBookings, totalKm, co2Saved, levelInfo, trustScore, trustLabel, responseSpeed, completionRate } = useMemo(() => {
    const cRides = myRides.filter(r => r.status === 'active' || isRideCompleted(r.date, r.time));
    const cBookings = myBookings.filter(b => b.status === 'confirmed');
    let km = 0;
    let passengers = 0;

    cRides.forEach(ride => {
      const dist = getDistanceBetweenCities(ride.from_city, ride.to_city);
      if (dist) {
        km += dist;
        passengers += (ride.bookings_count || 0);
      }
    });

    cBookings.forEach(booking => {
      const dist = getDistanceBetweenCities(booking.rides.from_city, booking.rides.to_city);
      if (dist) km += dist;
    });

    const score = profile ? computeTrustScore(profile) : 0;
    const label = getTrustLevel(score);
    const speed = profile ? getResponseSpeed(profile.rating) : "Risponde subito";
    const rate = profile ? getCompletionRate(profile.completed_rides_count ?? null, profile.rides_count ?? null) : 100;

    return {
      completedRides: cRides,
      completedBookings: cBookings,
      totalKm: km,
      co2Saved: calculateCO2Saved(km, passengers),
      levelInfo: profile ? getLevelInfo(profile.points) : null,
      trustScore: score,
      trustLabel: label,
      responseSpeed: speed,
      completionRate: rate,
    };
  }, [myRides, myBookings, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  function ProfileMobile() {
    return (
      <div className="min-h-screen bg-surface-container-lowest">
        {/* Pull to refresh indicator */}
        <div
          className="flex justify-center items-center h-0 overflow-visible transition-all duration-200 fixed top-0 left-0 right-0 z-50 pointer-events-none"
          style={{ height: pullDistance > 0 ? pullDistance : 0, opacity: pullDistance > 0 ? 1 : 0 }}
        >
          <div className={`flex items-center gap-2 text-on-surface/60 transition-opacity ${pullDistance > 60 ? 'opacity-100' : 'opacity-50'}`}>
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
            <span className="text-sm">{pullDistance > 60 ? t("releaseToRefresh") : t("pullToRefresh")}</span>
          </div>
        </div>
        <main
          ref={mainRef}
          className="min-h-screen overflow-y-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
        <AuroraBackground className="border-b border-white/5">
          <OrbGlow className="-top-10 -right-20" color="#e63946" size={260} opacity={0.32} />
          <header className="relative text-primary flex justify-between items-end w-full px-4 sm:px-6 pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Link href={`/${locale}/profilo`} className="w-10 h-10 bg-white/[0.06] rounded-full overflow-hidden border border-white/15 flex items-center justify-center backdrop-blur-md">
                {userAvatar ? (
                  <Image
                    src={userAvatar!}
                    alt={t("profilePhotoAlt")}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full items-center justify-center ${userAvatar ? 'hidden' : 'flex'}`}>
                  <User className="w-5 h-5 text-on-surface-variant" />
                </div>
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tighter text-on-surface uppercase"><GradientText>Andamus</GradientText></h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-primary p-2">
                <ShareApp variant="icon" className="text-primary" />
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md text-[#ffb3b1] hover:bg-white/[0.08] transition-all active:scale-95"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>
        </AuroraBackground>

        <main className="max-w-md mx-auto">
          <Reveal>
          <section className="px-4 sm:px-6 py-8 flex flex-col items-center overflow-x-hidden">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="custom-ring w-full h-full absolute">
                <circle className="text-white/8" cx="80" cy="80" fill="transparent" r="74" stroke="currentColor" strokeWidth="4" />
                <circle
                  className="text-[#ffb3b1]"
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="74"
                  stroke="currentColor"
                  strokeDasharray="465"
                  strokeDashoffset={profile ? 465 - (465 * Math.min((profile.points % 100) / 100, 1)) : 120}
                  strokeWidth="6"
                  style={{ filter: "drop-shadow(0 0 8px rgba(255,179,177,0.5))" }}
                />
              </svg>
              <div className="text-center z-10">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb3b1] mb-1">{t("level")}</span>
                <span className="text-4xl font-extrabold tracking-tighter text-on-surface">{(levelInfo ? tl(levelInfo.current.key) : "Novice")}</span>
              </div>
              <div className="absolute -bottom-2 bg-[#e63946] text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-[#e63946]/40">
                {(levelInfo ? `${levelInfo.current.emoji} ${tl(levelInfo.current.key)}` : "Member")}
              </div>
            </div>
            <div className="mt-8 text-center">
              <h2 className="text-4xl font-extrabold tracking-tight mb-1 text-on-surface">{userName}</h2>
              <p className="text-on-surface-variant text-sm font-medium opacity-80 uppercase tracking-widest">
                {formatAccountAge(profile?.created_at || user?.created_at)} · {t("explorerSince", { year: user?.created_at ? new Date(user.created_at).getFullYear() : "2022" })}
              </p>
              {streak && streak.current > 1 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
                  {t("streakActive", { count: streak.current })}
                </div>
              )}
            </div>
            
            {/* Onboarding Milestone Banner */}
            {profile && (!profile.avatar_url || !profile.car_model || !profile.phone_verified) && (
              <div 
                className="w-full mt-6 bg-gradient-to-br from-[#f4a261]/20 to-[#e63946]/10 border border-[#f4a261]/30 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-black/20"
                onClick={() => document.getElementById("profile-settings")?.scrollIntoView({ behavior: "smooth" })}
              >
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">Completa il tuo profilo</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Aggiungi {!profile.avatar_url ? "una foto" : !profile.phone_verified ? "il tuo numero" : "la tua auto"} per aumentare la fiducia e ricevere più prenotazioni.
                  </p>
                </div>
                <div className="ml-4 shrink-0 bg-[#f4a261]/20 p-2 rounded-full">
                  <ChevronRight className="w-4 h-4 text-[#f4a261]" />
                </div>
              </div>
            )}
          </section>
          </Reveal>

          <section className="px-4 sm:px-6 mb-12">
            <RevealStagger className="grid grid-cols-2 gap-3">
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 p-4 rounded-2xl flex flex-col justify-between min-h-[110px]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                  <Car className="w-5 h-5 text-[#ffb3b1]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-on-surface">
                    <AnimatedCounter value={myRides.length + myBookings.length} />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("trips")}</p>
                </div>
              </TiltCard>
              </RevealItem>
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 p-4 rounded-2xl flex flex-col justify-between min-h-[110px]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                  <Route className="w-5 h-5 text-[#ffb3b1]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-on-surface">
                    <GradientText><AnimatedCounter value={Math.round(totalKm)} suffix="km" /></GradientText>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("totalKm")}</p>
                </div>
              </TiltCard>
              </RevealItem>
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 p-4 rounded-2xl flex flex-col justify-between min-h-[110px]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                  <Star className="w-5 h-5 text-[#ffb3b1]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-on-surface">
                    <AnimatedCounter value={profile?.rating || 5.0} decimals={1} />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("rating")} <span className="text-white/30">({profile?.review_count || 0})</span></p>
                </div>
              </TiltCard>
              </RevealItem>
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-gradient-to-br from-primary/[0.07] to-transparent border border-primary/15 p-4 rounded-2xl flex flex-col justify-between min-h-[110px]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-on-surface">
                    <AnimatedCounter value={trustScore} suffix="%" />
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${trustLabel.color}`}>{trustLabel.label}</p>
                </div>
              </TiltCard>
              </RevealItem>
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 p-4 rounded-2xl flex flex-col justify-between min-h-[110px]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                  <Repeat className="w-5 h-5 text-[#ffb3b1]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-on-surface">
                    <AnimatedCounter value={completionRate} suffix="%" />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Affidabilità</p>
                </div>
              </TiltCard>
              </RevealItem>
              <RevealItem>
              <TiltCard tiltStrength={5} className="bg-white/[0.025] border border-white/8 p-4 rounded-2xl flex flex-col justify-between min-h-[110px]">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                  <MessageCircle className="w-5 h-5 text-[#ffb3b1]" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-on-surface truncate max-w-[140px]">
                    {responseSpeed}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Risposta</p>
                </div>
              </TiltCard>
              </RevealItem>
            </RevealStagger>
          </section>

          <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
            <div className="bg-surface-container p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                <Shield className="w-5 h-5 text-primary" />
                {t("verificationAndSecurity")}
              </h3>
              
              {/* Phone Verification */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">{t("phoneNumber")}</p>
                  <p className="text-xs text-on-surface-variant">
                    {user?.phone ? user.phone : t("notVerified")}
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
                      .then(({ data }: { data: Record<string, unknown> | null }) => {
                        if (data) setProfile(data as unknown as Profile);
                      });
                  }}
                />
              </div>
            </div>
          </section>

          {/* Stripe Connect */}
          <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
            <div className="bg-surface-container p-4 rounded-xl">
              <h3 className="mb-4 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                <CreditCard className="w-5 h-5 text-primary" />
                {t("payments")}
              </h3>
              <StripeConnectBanner />
            </div>
          </section>

          {/* Car Info Section */}
          <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
            <div className="bg-surface-container p-4 rounded-xl">
              <h3 className="mb-4 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                <Car className="w-5 h-5 text-primary" />
                {t("yourVehicle")}
              </h3>
              <CarInfoForm
                initialData={{
                  car_model: profile?.car_model,
                  car_color: profile?.car_color,
                  car_plate: profile?.car_plate,
                  car_year: profile?.car_year,
                }}
                onSave={handleSaveCarInfo}
              />
            </div>
          </section>

          <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
            <div className="bg-surface-container p-4 rounded-xl">
              <h3 className="mb-3 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                <Bell className="w-5 h-5 text-primary" />
                {t("pushNotifications")}
              </h3>
              <PushNotificationToggle />
            </div>
          </section>

          <ReferralCard locale={locale} profile={profile} />

          {user && (
            <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
              <EmailPreferences userId={user.id} />
            </section>
          )}

          {profile && levelInfo && (
            <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
              <div className="bg-surface-container p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("currentLevel")}</p>
                    <p className="font-extrabold text-on-surface">{levelInfo.current.emoji} {tl(levelInfo.current.key)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("points")}</p>
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
                    ? t("pointsToNextLevel", { points: levelInfo.next.min - profile.points })
                    : t("maxLevelReached")}
                </p>
              </div>
            </section>
          )}

          {bookingRequests.length > 0 && (
            <section className="px-4 sm:px-6 mb-8 overflow-x-hidden">
              <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-on-surface">
                {t("pendingRequestsCount", { count: bookingRequests.length })}
              </h3>
              <div className="space-y-3">
                {bookingRequests.map((request) => (
                  <div key={request.id} className="rounded-xl bg-surface-container p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                          {request.passenger.avatar_url ? (
                            <Image src={request.passenger.avatar_url} alt={request.passenger.name} width={40} height={40} className="w-full h-full object-cover rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                            {t("dateAtTime", { date: formatDate(request.ride.date), time: request.ride.time.slice(0, 5) })}
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
                          {t("reject")}
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
                          {t("accept")}
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
                { id: "rides", label: t("tabRides") },
                { id: "bookings", label: t("tabBookings") },
                { id: "templates", label: t("tabRecurring") },
                { id: "alerts", label: t("tabAlerts") },
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
                      href={`/${locale}/corsa/${ride.id}`}
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
                          <span className="text-xl font-extrabold text-on-surface">{ride.price === 0 ? t("free") : `€${ride.price}`}</span>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                            {isRideCompleted(ride.date) ? t("rideCompleted") : t("rideActive")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-on-surface-variant" />
                        </div>
                        <span className="text-[11px] font-semibold text-on-surface-variant">{ride.seats} {t("seats")} · {(ride.bookings_count || 0)} {t("requests")}</span>
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
                            <span className="text-xl font-extrabold text-on-surface">{booking.rides.price === 0 ? t("free") : `€${booking.rides.price}`}</span>
                            {completed && <p className="text-[10px] font-bold text-tertiary uppercase tracking-tighter">{t("rideCompleted")}</p>}
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
                            {completed && !reviewedRides.has(booking.rides.id) ? (
                              <button
                                onClick={() => openRatingModal(booking.rides.id, {
                                  id: booking.rides.profiles.id,
                                  name: booking.rides.profiles.name,
                                  avatar_url: booking.rides.profiles.avatar_url
                                })}
                                className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1.5 text-sm font-bold text-primary"
                              >
                                <Star className="h-3 w-3" />
                                {t("review")}
                              </button>
                            ) : (
                              <>
                                {booking.status !== "cancelled" && (
                                  <>
                                    <Link href={`/${locale}/chat/${booking.id}`} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-on-primary">
                                      <MessageCircle className="h-3 w-3" />
                                      {t("chat")}
                                    </Link>
                                    <Link
                                      href={`/${locale}/cancella/${booking.id}`}
                                      className="flex items-center gap-1 rounded-full bg-error/20 px-3 py-1.5 text-sm font-bold text-error"
                                    >
                                      {t("cancel")}
                                    </Link>
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
                    title={t("noRecurringRides")}
                    description={t("noRecurringRidesDescription")}
                    icon={<Repeat className="w-12 h-12 text-[#e63946]" />}
                    action={{ label: t("createRecurring"), href: "/offri", variant: "outline" }}
                  />
                ) : (
                  rideTemplates.map((template) => (
                    <div key={template.id} className="bg-surface p-5 rounded-xl flex flex-col gap-4 border-l-4 border-surface-container-highest">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="text-xl font-extrabold tracking-tight text-on-surface">{template.from_city} — {template.to_city}</h3>
                          <p className="text-sm text-on-surface-variant mt-1">
                            {template.time.slice(0, 5)} · {template.seats} {t("seats")} · {template.price === 0 ? t("free") : `€${template.price}`}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {template.recurrence_days.map((d) => new Date(2023, 0, d + 1).toLocaleDateString(locale, { weekday: "short" })).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTemplate(template)}
                            disabled={togglingTemplateId === template.id}
                            className={`rounded-full px-3 py-1.5 text-sm font-bold ${template.is_active ? 'bg-surface-container-high text-on-surface' : 'bg-primary text-on-primary'} disabled:opacity-50`}
                          >
                            {togglingTemplateId === template.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (template.is_active ? t("suspend") : t("activate"))}
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deletingTemplateId === template.id}
                            className="p-2 rounded-full bg-error/20 text-error disabled:opacity-50"
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
                    title={t("noAlerts")}
                    description={t("noAlertsDescription")}
                    icon={<Bell className="w-12 h-12 text-[#e63946]" />}
                    action={{ label: t("searchAndCreateAlert"), href: "/cerca", variant: "outline" }}
                  />
                ) : (
                  rideAlerts.map((alert) => (
                    <div key={alert.id} className="bg-surface p-5 rounded-xl flex items-center justify-between border-l-4 border-surface-container-highest">
                      <div>
                        <h3 className="font-bold text-on-surface">{alert.from_city || t("any")} → {alert.to_city || t("any")}</h3>
                        <p className="text-sm text-on-surface-variant">
                          {alert.start_date && `${t("fromDate")} ${formatDate(alert.start_date)}`}
                          {alert.end_date && ` ${t("toDate")} ${formatDate(alert.end_date)}`}
                          {alert.min_seats !== null && ` · ${t("min")} ${alert.min_seats} ${t("seats")}`}
                          {alert.max_price !== null && ` · ${t("max")} ${alert.max_price}€`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        disabled={deletingAlertId === alert.id}
                        className="p-2 rounded-full bg-error/20 text-error disabled:opacity-50"
                      >
                        {deletingAlertId === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
              <h3 className="text-lg font-extrabold text-on-surface mb-2">{t("wantToLeave")}</h3>
              <p className="text-sm text-on-surface-variant mb-6">{t("loginAgainToUseApp")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-bold text-on-surface"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-xl bg-error py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {isLoggingOut ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("logout")}
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface-container-low p-6">
              <h3 className="text-lg font-extrabold text-on-surface mb-2">{t("cancelBookingTitle")}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{t("enterCancellationReason")}</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-surface-container-high rounded-xl p-3 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                placeholder={t("reasonPlaceholder")}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setCancelBookingId(null); setCancelReason(""); }}
                  className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-bold text-on-surface"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim() || isCancelling}
                  className="flex-1 rounded-xl bg-error py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {isCancelling ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("confirm")}
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
            onSuccess={handleReviewSuccess}
          />
        )}
        {showPostAction && (
          <Suspense fallback={null}>
            <PostActionModal
              type={postActionType}
              open={showPostAction}
              onClose={() => setShowPostAction(false)}
              context={postActionContext}
            />
          </Suspense>
        )}
        </main>
      </div>
    );
  }
  function ProfileDesktop() {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-on-surface pb-16 relative">
        <AuroraBackground className="absolute inset-x-0 top-0 h-[520px] -z-10 pointer-events-none" showRadialMask={false}>
          <OrbGlow className="-top-20 -left-20" color="#e63946" size={340} opacity={0.30} />
        </AuroraBackground>
        <div className="max-w-6xl mx-auto px-8 py-10 relative">
          <Reveal>
          <section className="flex items-center gap-10 mb-12">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="custom-ring w-full h-full absolute">
                <circle className="text-white/8" cx="96" cy="96" fill="transparent" r="90" stroke="currentColor" strokeWidth="4" />
                <circle
                  className="text-[#ffb3b1]"
                  cx="96"
                  cy="96"
                  fill="transparent"
                  r="90"
                  stroke="currentColor"
                  strokeDasharray="565"
                  strokeDashoffset={profile ? 565 - (565 * Math.min((profile.points % 100) / 100, 1)) : 120}
                  strokeWidth="6"
                  style={{ filter: "drop-shadow(0 0 10px rgba(255,179,177,0.5))" }}
                />
              </svg>
              <div className="text-center z-10">
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#ffb3b1] mb-1">{t("level")}</span>
                <span className="text-5xl font-extrabold tracking-tighter text-on-surface">{(levelInfo ? tl(levelInfo.current.key) : "Novice")}</span>
              </div>
              <div className="absolute -bottom-2 bg-[#e63946] text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-xl shadow-[#e63946]/40">
                {(levelInfo ? `${levelInfo.current.emoji} ${tl(levelInfo.current.key)}` : "Member")}
              </div>
            </div>
            <div>
              <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 text-on-surface">
                <GradientText>{userName}</GradientText>
              </h2>
              <p className="text-on-surface-variant text-base font-medium opacity-80 uppercase tracking-widest">
                {formatAccountAge(profile?.created_at || user?.created_at)} · {t("explorerSince", { year: user?.created_at ? new Date(user.created_at).getFullYear() : "2022" })}
              </p>
              {streak && streak.current > 1 && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
                  {t("streakActive", { count: streak.current })}
                </div>
              )}
            </div>
          </section>
          </Reveal>

          <RevealStagger className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <RevealItem>
            <TiltCard tiltStrength={6} className="bg-white/[0.025] border border-white/8 p-6 rounded-2xl flex flex-col justify-between min-h-[150px] backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                <Car className="w-6 h-6 text-[#ffb3b1]" />
              </div>
              <div>
                <p className="text-4xl font-extrabold text-on-surface">
                  <AnimatedCounter value={myRides.length + myBookings.length} />
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("trips")}</p>
              </div>
            </TiltCard>
            </RevealItem>
            <RevealItem>
            <TiltCard tiltStrength={6} className="bg-white/[0.025] border border-white/8 p-6 rounded-2xl flex flex-col justify-between min-h-[150px] backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                <Route className="w-6 h-6 text-[#ffb3b1]" />
              </div>
              <div>
                <p className="text-4xl font-extrabold">
                  <GradientText><AnimatedCounter value={Math.round(totalKm)} suffix="km" /></GradientText>
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("totalKm")}</p>
              </div>
            </TiltCard>
            </RevealItem>
            <RevealItem>
            <TiltCard tiltStrength={6} className="bg-white/[0.025] border border-white/8 p-6 rounded-2xl flex flex-col justify-between min-h-[150px] backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ffb3b1]/10 ring-1 ring-[#ffb3b1]/20">
                <Star className="w-6 h-6 text-[#ffb3b1]" />
              </div>
              <div>
                <p className="text-4xl font-extrabold text-on-surface">
                  <AnimatedCounter value={profile?.rating || 5.0} decimals={1} />
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("rating")} <span className="text-white/30">({profile?.review_count || 0})</span></p>
              </div>
            </TiltCard>
            </RevealItem>
            <RevealItem>
            <TiltCard tiltStrength={6} className="bg-gradient-to-br from-primary/[0.08] to-transparent border border-primary/15 p-6 rounded-2xl flex flex-col justify-between min-h-[150px] backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-4xl font-extrabold text-on-surface">
                  <AnimatedCounter value={trustScore} suffix="%" />
                </p>
                <p className={`text-xs font-bold uppercase tracking-wider ${trustLabel.color}`}>{trustLabel.label}</p>
              </div>
            </TiltCard>
            </RevealItem>
          </RevealStagger>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {bookingRequests.length > 0 && (
                <section>
                  <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-on-surface">
                    {t("pendingRequestsCount", { count: bookingRequests.length })}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {bookingRequests.map((request) => (
                      <div key={request.id} className="rounded-2xl bg-surface-container p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                              {request.passenger.avatar_url ? (
                                <Image src={request.passenger.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
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
                                {t("dateAtTime", { date: formatDate(request.ride.date), time: request.ride.time.slice(0, 5) })}
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
                              {t("reject")}
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
                              {t("accept")}
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
                    { id: "rides", label: t("tabRides") },
                    { id: "bookings", label: t("tabBookings") },
                    { id: "templates", label: t("tabRecurring") },
                    { id: "alerts", label: t("tabAlerts") },
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
                            href={`/${locale}/corsa/${ride.id}`}
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
                                <span className="text-2xl font-extrabold text-on-surface">{ride.price === 0 ? t("free") : `€${ride.price}`}</span>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
                                  {isRideCompleted(ride.date) ? t("rideCompleted") : t("rideActive")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-on-surface-variant" />
                              </div>
                              <span className="text-sm font-semibold text-on-surface-variant">{ride.seats} {t("seats")} · {(ride.bookings_count || 0)} {t("requests")}</span>
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
                                  <span className="text-2xl font-extrabold text-on-surface">{booking.rides.price === 0 ? t("free") : `€${booking.rides.price}`}</span>
                                  {completed && <p className="text-xs font-bold text-tertiary uppercase tracking-tighter">{t("rideCompleted")}</p>}
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
                                  {completed && !reviewedRides.has(booking.rides.id) ? (
                                    <button
                                      onClick={() => openRatingModal(booking.rides.id, {
                                        id: booking.rides.profiles.id,
                                        name: booking.rides.profiles.name,
                                        avatar_url: booking.rides.profiles.avatar_url
                                      })}
                                      className="flex items-center gap-1 rounded-full bg-primary/20 px-4 py-2 text-sm font-bold text-primary"
                                    >
                                      <Star className="h-4 w-4" />
                                      {t("review")}
                                    </button>
                                  ) : (
                                    <>
                                      {booking.status !== "cancelled" && (
                                        <>
                                          <Link href={`/${locale}/chat/${booking.id}`} className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary">
                                            <MessageCircle className="h-4 w-4" />
                                            {t("chat")}
                                          </Link>
                                          <Link
                                            href={`/${locale}/cancella/${booking.id}`}
                                            className="flex items-center gap-1 rounded-full bg-error/20 px-4 py-2 text-sm font-bold text-error"
                                          >
                                            {t("cancel")}
                                          </Link>
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
                        title={t("noRecurringRides")}
                        description={t("noRecurringRidesDescription")}
                        icon={<Repeat className="w-12 h-12 text-[#e63946]" />}
                        action={{ label: t("createRecurring"), href: "/offri", variant: "outline" }}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rideTemplates.map((template) => (
                          <div key={template.id} className="bg-surface p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-surface-container-highest">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <h3 className="text-2xl font-extrabold tracking-tight text-on-surface">{template.from_city} — {template.to_city}</h3>
                                <p className="text-sm text-on-surface-variant mt-1">
                                  {template.time.slice(0, 5)} · {template.seats} {t("seats")} · {template.price === 0 ? t("free") : `€${template.price}`}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-1">
                                  {template.recurrence_days.map((d) => new Date(2023, 0, d + 1).toLocaleDateString(locale, { weekday: "short" })).join(", ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleTemplate(template)}
                                  className={`rounded-full px-4 py-2 text-sm font-bold ${template.is_active ? 'bg-surface-container-high text-on-surface' : 'bg-primary text-on-primary'}`}
                                >
                                  {template.is_active ? t("suspend") : t("activate")}
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
                        title={t("noAlerts")}
                        description={t("noAlertsDescription")}
                        icon={<Bell className="w-12 h-12 text-[#e63946]" />}
                        action={{ label: t("searchAndCreateAlert"), href: "/cerca", variant: "outline" }}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rideAlerts.map((alert) => (
                          <div key={alert.id} className="bg-surface p-6 rounded-2xl flex items-center justify-between border-l-4 border-surface-container-highest">
                            <div>
                              <h3 className="font-bold text-lg text-on-surface">{alert.from_city || t("any")} → {alert.to_city || t("any")}</h3>
                              <p className="text-sm text-on-surface-variant">
                                {alert.start_date && `${t("fromDate")} ${formatDate(alert.start_date)}`}
                                {alert.end_date && ` ${t("toDate")} ${formatDate(alert.end_date)}`}
                                {alert.min_seats !== null && ` · ${t("min")} ${alert.min_seats} ${t("seats")}`}
                                {alert.max_price !== null && ` · ${t("max")} ${alert.max_price}€`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              disabled={deletingAlertId === alert.id}
                              className="p-3 rounded-full bg-error/20 text-error disabled:opacity-50"
                            >
                              {deletingAlertId === alert.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
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
                  {t("verificationAndSecurity")}
                </h3>
                
                {/* Phone Verification - Desktop */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{t("phoneNumber")}</p>
                      <p className="text-xs text-on-surface-variant">
                        {user?.phone ? user.phone : t("notVerified")}
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
                        .then(({ data }: { data: Record<string, unknown> | null }) => {
                          if (data) setProfile(data as unknown as Profile);
                        });
                    }}
                  />
                </div>
              </div>

              {/* Stripe Connect - Desktop */}
              <div className="bg-surface-container p-6 rounded-2xl">
                <h3 className="mb-4 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {t("payments")}
                </h3>
                <StripeConnectBanner />
              </div>

              {/* Car Info - Desktop */}
              <div className="bg-surface-container p-6 rounded-2xl">
                <h3 className="mb-4 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                  <Car className="w-5 h-5 text-primary" />
                  {t("yourVehicle")}
                </h3>
                <CarInfoForm
                  initialData={{
                    car_model: profile?.car_model,
                    car_color: profile?.car_color,
                    car_plate: profile?.car_plate,
                    car_year: profile?.car_year,
                  }}
                  onSave={handleSaveCarInfo}
                />
              </div>

              <div className="bg-surface-container p-6 rounded-2xl">
                <h3 className="mb-4 text-sm font-extrabold text-on-surface flex items-center gap-2 uppercase tracking-wider">
                  <Bell className="w-5 h-5 text-primary" />
                  {t("pushNotifications")}
                </h3>
                <PushNotificationToggle />
              </div>

              {user && (
                <div className="bg-surface-container p-6 rounded-2xl">
                  <EmailPreferences userId={user.id} />
                </div>
              )}

              {profile && levelInfo && (
                <div className="bg-surface-container p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">{t("currentLevel")}</p>
                      <p className="font-extrabold text-on-surface">{levelInfo.current.emoji} {tl(levelInfo.current.key)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">{t("points")}</p>
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
                      ? t("pointsToNextLevel", { points: levelInfo.next.min - profile.points })
                      : t("maxLevelReached")}
                  </p>
                </div>
              )}

              <ShareApp variant="card" />

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full bg-error/10 text-error rounded-2xl p-4 font-bold uppercase tracking-widest text-sm hover:bg-error/20 transition-colors"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        </div>

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface-container-low p-6">
              <h3 className="text-lg font-extrabold text-on-surface mb-2">{t("wantToLeave")}</h3>
              <p className="text-sm text-on-surface-variant mb-6">{t("loginAgainToUseApp")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-bold text-on-surface"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-xl bg-error py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {isLoggingOut ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("logout")}
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface-container-low p-6">
              <h3 className="text-lg font-extrabold text-on-surface mb-2">{t("cancelBookingTitle")}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{t("enterCancellationReason")}</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-surface-container-high rounded-xl p-3 text-sm text-on-surface border-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                placeholder={t("reasonPlaceholder")}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setCancelBookingId(null); setCancelReason(""); }}
                  className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-bold text-on-surface"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim()}
                  className="flex-1 rounded-xl bg-error py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {t("confirm")}
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
            onSuccess={handleReviewSuccess}
          />
        )}
        {showPostAction && (
          <Suspense fallback={null}>
            <PostActionModal
              type={postActionType}
              open={showPostAction}
              onClose={() => setShowPostAction(false)}
              context={postActionContext}
            />
          </Suspense>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {deviceType === "desktop" ? <ProfileDesktop /> : <ProfileMobile />}
    </ErrorBoundary>
  );
}
