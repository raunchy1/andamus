"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import Image from "next/image";
import {
  Loader2,
  Check,
  X,
  Trash2,
  MessageCircle,
  Star,
  User,
  LogOut,
  Car,
  Bell,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Mail,
  ChevronRight,
  ChevronDown,
  Camera,
  MapPin,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { RatingModal } from "@/components/RatingModal";
import { ReferralCard } from "@/components/ReferralCard";
import dynamic from "next/dynamic";

const PostActionModal = dynamic(() => import("@/components/PostActionModal").then(m => m.PostActionModal), { ssr: false });
import { acceptBooking, rejectBooking } from "@/lib/booking-lifecycle";
import { getDistanceBetweenCities } from "@/lib/sardinia-cities";
import { ProductAnalytics } from "@/lib/posthog";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { EmailPreferences } from "@/components/EmailPreferences";
import { CarInfoForm } from "@/components/CarInfoForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getLevelInfo, completeGamificationAction } from "@/lib/gamification";
import { computeTrustScore, getTrustLevel, getAccountAge, getCompletionRate } from "@/lib/reputation";
import { Haptic } from "@/lib/haptic";
import { EmptyState, EmptyStateProfile } from "@/components/EmptyState";
import { StripeConnectBanner } from "@/components/StripeConnectBanner";
import { ShareApp } from "@/components/ShareApp";
import { Reveal } from "@/components/ui/premium/reveal";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split("T")[0];
}

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
  email_verified?: boolean;
  id_verified?: boolean;
  driver_verified?: boolean;
  referral_code?: string | null;
  referrals_count?: number | null;
  referral_points_earned?: number | null;
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

/* ─────────────────────────────────────────────────────────────
   Shared building blocks.

   Icon discipline for this whole cluster: one family (lucide),
   one stroke weight (1.5), two sizes (16 / 20). Icons are ink or
   muted; green marks a state that is genuinely satisfied and
   terracotta is reserved for leaving, deleting and emergencies.
   No coloured chip ever sits behind an icon just to fill space.
   ───────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </p>
  );
}

function Panel({
  title,
  children,
  className = "",
  id,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-2xl border border-line bg-surface ${className}`}>
      {title && (
        <div className="border-b border-line px-5 py-3.5">
          <Eyebrow>{title}</Eyebrow>
        </div>
      )}
      {children}
    </section>
  );
}

/** A settings row that navigates somewhere else. */
function LinkRow({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  detail?: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[56px] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-sand active:bg-sand"
    >
      <Icon className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {detail && <span className="mt-0.5 block truncate text-xs text-muted">{detail}</span>}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-faint" strokeWidth={1.5} aria-hidden />
    </Link>
  );
}

/**
 * A settings row that expands in place. Native <details> so it stays
 * keyboard-operable and works before hydration.
 */
function DisclosureRow({
  icon: Icon,
  label,
  detail,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  label: string;
  detail?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-5 py-3.5 transition-colors hover:bg-sand [&::-webkit-details-marker]:hidden">
        <Icon className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{label}</span>
          {detail && <span className="mt-0.5 block truncate text-xs text-muted">{detail}</span>}
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-faint transition-transform group-open:rotate-180"
          strokeWidth={1.5}
          aria-hidden
        />
      </summary>
      <div className="border-t border-line-soft bg-sand/40 px-5 py-4">{children}</div>
    </details>
  );
}

/** One number in the ledger strip. Tabular figures keep the row from jittering. */
function LedgerCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4 text-center first:pl-5 last:pr-5">
      <span className="font-heading text-2xl text-ink tabular-nums sm:text-3xl">{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const emailConfirmed = Boolean(user?.email_confirmed_at);
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

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const [supabase] = useState(() => createClient());
  const isMountedRef = useRef(true);

  const t = useTranslations("profile");
  const tl = useTranslations("levels");
  const tRep = useTranslations("reputation");
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
      setProfile(prev => prev ? { ...prev, ...carData } : null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("invalidFileType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setUploadingAvatar(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
      toast.success(t("photoUpdated"));
    } catch {
      toast.error(t("uploadError"));
    } finally {
      setUploadingAvatar(false);
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
    if (!window.confirm(t("confirmDeleteAlert"))) return;
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
    if (!window.confirm(t("confirmDeleteTemplate"))) return;
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
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0 && window.scrollY === 0) {
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

  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-green";
      case "pending": return "text-pending";
      case "rejected": return "text-terracotta";
      case "cancelled": return "text-terracotta";
      default: return "text-muted";
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

  const { totalKm, levelInfo, trustLabel, completionRate } = useMemo(() => {
    const cRides = myRides.filter(r => r.status === 'active' || isRideCompleted(r.date, r.time));
    const cBookings = myBookings.filter(b => b.status === 'confirmed');
    let km = 0;

    cRides.forEach(ride => {
      const dist = getDistanceBetweenCities(ride.from_city, ride.to_city);
      if (dist) km += dist;
    });

    cBookings.forEach(booking => {
      const dist = getDistanceBetweenCities(booking.rides.from_city, booking.rides.to_city);
      if (dist) km += dist;
    });

    const score = profile ? computeTrustScore(profile) : 0;
    const rate = profile ? getCompletionRate(profile.completed_rides_count ?? null, profile.rides_count ?? null) : null;

    return {
      totalKm: km,
      // The trust score is a heuristic, not a measurement. We show the band it
      // falls into and deliberately not a percentage, which would claim a
      // precision the number does not have.
      trustLabel: getTrustLevel(score),
      levelInfo: profile ? getLevelInfo(profile.points) : null,
      completionRate: rate,
    };
  }, [myRides, myBookings, profile]);

  const tripCount = myRides.length + myBookings.length;
  const hasHistory = tripCount > 0;
  const reviewCount = profile?.review_count ?? 0;

  const setupSteps: {
    key: string;
    icon: React.ElementType;
    title: string;
    body: string;
    done: boolean;
    href?: string;
    onClick?: () => void;
  }[] = useMemo(
    () => [
      {
        key: "photo",
        icon: Camera,
        title: t("setupPhotoTitle"),
        body: t("setupPhotoBody"),
        done: Boolean(userAvatar),
        onClick: () => avatarInputRef.current?.click(),
      },
      {
        key: "ride",
        icon: MapPin,
        title: t("setupRideTitle"),
        body: t("setupRideBody"),
        done: hasHistory,
        href: `/${locale}/offri`,
      },
    ],
    [t, locale, userAvatar, hasHistory]
  );

  const pendingSteps = setupSteps.filter((s) => !s.done);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-green" strokeWidth={1.5} />
        <span className="sr-only">{t("loadingProfile")}</span>
      </div>
    );
  }

  const tabs = [
    { id: "rides", label: t("tabRides"), count: myRides.length },
    { id: "bookings", label: t("tabBookings"), count: myBookings.length },
    { id: "templates", label: t("tabRecurring"), count: rideTemplates.length },
    { id: "alerts", label: t("tabAlerts"), count: rideAlerts.length },
  ];

  return (
    <ErrorBoundary>
      <div
        ref={mainRef}
        className="w-full pb-12"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Pull to refresh indicator */}
        <div
          className="pointer-events-none fixed inset-x-0 top-16 z-30 flex items-center justify-center overflow-hidden transition-all duration-200"
          style={{ height: pullDistance, opacity: pullDistance > 0 ? 1 : 0 }}
        >
          <span className="flex items-center gap-2 text-xs font-medium text-muted">
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              strokeWidth={1.5}
              style={{ transform: `rotate(${pullDistance * 2}deg)` }}
            />
            {pullDistance > 60 ? t("releaseToRefresh") : t("pullToRefresh")}
          </span>
        </div>

        {/* ── Identity ──────────────────────────────────────────── */}
        <Reveal>
          <header className="px-4 pt-6 md:px-0 md:pt-8">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-line bg-sand-deep sm:h-20 sm:w-20">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={t("profilePhotoAlt")}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <User className="h-7 w-7 text-faint" strokeWidth={1.5} aria-hidden />
                    </span>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label={t("changePhoto")}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-ink disabled:opacity-60"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Camera className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-[26px] leading-tight text-ink sm:text-3xl">
                  {userName}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {t("memberSince", {
                    age: (() => {
                      const a = getAccountAge(profile?.created_at || user?.created_at);
                      return tRep(`age.${a.unit}`, { count: a.count });
                    })(),
                  })}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sand px-2.5 py-1 text-xs font-medium text-ink">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} aria-hidden />
                    {tRep(`trust.${trustLabel.label}`)}
                  </span>
                  {reviewCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <Star className="h-3.5 w-3.5 text-ink" strokeWidth={1.5} aria-hidden />
                      <span className="font-medium text-ink tabular-nums">
                        {(profile?.rating ?? 5).toFixed(1)}
                      </span>
                      {tRep("reviewCount", { count: reviewCount })}
                    </span>
                  )}
                  {streak && streak.current > 1 && (
                    <span className="text-xs text-muted">
                      {t("streakActive", { count: streak.current })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Level: one quiet line, not a hero ornament */}
            {profile && levelInfo && (
              <div className="mt-6">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-medium text-ink">{tl(levelInfo.current.key)}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {t("pointsCount", { points: profile.points })}
                  </p>
                </div>
                <div
                  className="mt-2 h-1 w-full overflow-hidden rounded-full bg-track"
                  role="progressbar"
                  aria-valuenow={Math.round(levelInfo.progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={tl(levelInfo.current.key)}
                >
                  <div
                    className="h-full rounded-full bg-green transition-[width] duration-500"
                    style={{ width: `${Math.max(2, levelInfo.progress)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {levelInfo.next
                    ? t("pointsToNextLevelNamed", {
                        points: levelInfo.next.min - profile.points,
                        level: tl(levelInfo.next.key),
                      })
                    : t("maxLevelReached")}
                </p>
              </div>
            )}
          </header>
        </Reveal>

        {/* ── Ledger, or a real first-run start ─────────────────── */}
        <div className="mt-6 px-4 md:px-0">
          {hasHistory ? (
            <Reveal delay={0.05}>
              <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface">
                <LedgerCell value={numberFormat.format(tripCount)} label={t("trips")} />
                <LedgerCell value={`${numberFormat.format(Math.round(totalKm))} km`} label={t("totalKm")} />
                <LedgerCell
                  value={completionRate === null ? "—" : `${completionRate}%`}
                  label={t("completedRidesLabel")}
                />
              </div>
              <Link
                href={`/${locale}/statistiche`}
                className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-green hover:underline"
              >
                <BarChart3 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {t("openStats")}
              </Link>
            </Reveal>
          ) : (
            <Reveal delay={0.05}>
              <Panel title={t("setupTitle")}>
                <p className="px-5 pt-4 text-sm leading-relaxed text-muted">{t("setupIntro")}</p>
                <ol className="mt-3 divide-y divide-line-soft">
                  {setupSteps.map((step) => {
                    const inner = (
                      <>
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            step.done ? "border-green bg-green" : "border-line-strong"
                          }`}
                          aria-hidden
                        >
                          {step.done ? (
                            <Check className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                          ) : (
                            <step.icon className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm font-medium ${
                              step.done ? "text-muted line-through" : "text-ink"
                            }`}
                          >
                            {step.title}
                          </span>
                          {!step.done && (
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                              {step.body}
                            </span>
                          )}
                        </span>
                        {!step.done && (step.href || step.onClick) && (
                          <ChevronRight className="h-5 w-5 shrink-0 text-faint" strokeWidth={1.5} aria-hidden />
                        )}
                      </>
                    );
                    const rowClass =
                      "flex w-full min-h-[56px] items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-sand";
                    return (
                      <li key={step.key}>
                        {step.done ? (
                          <div className="flex min-h-[56px] items-start gap-3 px-5 py-3.5">{inner}</div>
                        ) : step.href ? (
                          <Link href={step.href} className={rowClass}>{inner}</Link>
                        ) : step.onClick ? (
                          <button type="button" onClick={step.onClick} className={rowClass}>{inner}</button>
                        ) : (
                          <div className="flex min-h-[56px] items-start gap-3 px-5 py-3.5">{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </Panel>
            </Reveal>
          )}
        </div>

        {/* Slim nudge once the user is active but the profile is still thin */}
        {hasHistory && pendingSteps.length > 0 && (
          <div className="mt-4 px-4 md:px-0">
            <p className="rounded-xl border border-line bg-green-tint px-4 py-3 text-sm leading-relaxed text-ink">
              {t("setupNudge", { task: pendingSteps[0].title.toLowerCase() })}
            </p>
          </div>
        )}

        {/* ── Two columns from lg up ────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 gap-8 px-4 md:px-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-8">
            {/* Pending booking requests — the only thing on this page that
                needs an answer today, so it sits above the tabs. */}
            {bookingRequests.length > 0 && (
              <section>
                <h2 className="mb-3 font-heading text-lg text-ink">
                  {t("pendingRequestsCount", { count: bookingRequests.length })}
                </h2>
                <div className="space-y-3">
                  {bookingRequests.map((request) => (
                    <article
                      key={request.id}
                      className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sand-deep">
                          {request.passenger.avatar_url ? (
                            <Image
                              src={request.passenger.avatar_url}
                              alt=""
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <User className="h-5 w-5 text-faint" strokeWidth={1.5} aria-hidden />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{request.passenger.name}</p>
                          <p className="truncate text-sm text-muted">
                            {request.ride.from_city} → {request.ride.to_city}
                          </p>
                          <p className="text-xs text-muted">
                            {t("dateAtTime", { date: formatDate(request.ride.date), time: request.ride.time.slice(0, 5) })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2 sm:justify-end">
                        <button
                          onClick={() => handleRejectBooking(request)}
                          disabled={processingBooking === request.id}
                          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-medium text-ink transition-colors hover:bg-sand disabled:opacity-50 sm:flex-none sm:px-8"
                        >
                          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                          {t("reject")}
                        </button>
                        <button
                          onClick={() => handleAcceptBooking(request)}
                          disabled={processingBooking === request.id}
                          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-green text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none sm:px-8"
                        >
                          {processingBooking === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                          ) : (
                            <Check className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                          )}
                          {t("accept")}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Tabs */}
            <section>
              <div
                role="tablist"
                aria-label={t("activityTabsLabel")}
                className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 no-scrollbar md:mx-0 md:px-0"
              >
                {tabs.map((tab) => {
                  const selected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative -mb-px min-h-[44px] whitespace-nowrap border-b-2 px-3 text-sm transition-colors ${
                        selected
                          ? "border-green font-semibold text-ink"
                          : "border-transparent font-medium text-muted hover:text-ink"
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-1.5 text-xs text-faint tabular-nums">{tab.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {activeTab === "rides" && (
                  myRides.length === 0 ? (
                    <EmptyStateProfile type="rides" />
                  ) : (
                    myRides.map((ride) => (
                      <Link
                        key={ride.id}
                        href={`/${locale}/corsa/${ride.id}`}
                        className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
                              {formatDate(ride.date)} · {ride.time.slice(0, 5)}
                            </p>
                            <h3 className="mt-1 font-heading text-lg text-ink">
                              {ride.from_city} — {ride.to_city}
                            </h3>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-heading text-lg text-ink tabular-nums">
                              {ride.price === 0 ? t("free") : `€${ride.price}`}
                            </p>
                            <p className="text-xs text-muted">
                              {isRideCompleted(ride.date) ? t("rideCompleted") : t("rideActive")}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-muted">
                          {t("seatsCount", { count: ride.seats })} · {t("requestsCount", { count: ride.bookings_count || 0 })}
                        </p>
                      </Link>
                    ))
                  )
                )}

                {activeTab === "bookings" && (
                  myBookings.length === 0 ? (
                    <EmptyStateProfile type="bookings" />
                  ) : (
                    myBookings.map((booking) => {
                      const completed = isRideCompleted(booking.rides.date);
                      return (
                        <article
                          key={booking.id}
                          className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className={`text-xs font-medium uppercase tracking-[0.08em] ${getStatusColor(booking.status)}`}>
                                {getStatusLabel(booking.status)}
                              </p>
                              <h3 className="mt-1 font-heading text-lg text-ink">
                                {booking.rides.from_city} — {booking.rides.to_city}
                              </h3>
                              <p className="mt-1 text-xs text-muted">
                                {booking.rides.time.slice(0, 5)} · {booking.rides.profiles.name}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-heading text-lg text-ink tabular-nums">
                                {booking.rides.price === 0 ? t("free") : `€${booking.rides.price}`}
                              </p>
                              {completed && <p className="text-xs text-muted">{t("rideCompleted")}</p>}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {completed && !reviewedRides.has(booking.rides.id) ? (
                              <button
                                onClick={() => openRatingModal(booking.rides.id, {
                                  id: booking.rides.profiles.id,
                                  name: booking.rides.profiles.name,
                                  avatar_url: booking.rides.profiles.avatar_url
                                })}
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-sand"
                              >
                                <Star className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                                {t("review")}
                              </button>
                            ) : booking.status !== "cancelled" ? (
                              <>
                                <Link
                                  href={`/${locale}/chat/${booking.id}`}
                                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                >
                                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                                  {t("chat")}
                                </Link>
                                <Link
                                  href={`/${locale}/cancella/${booking.id}`}
                                  className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 text-sm font-medium text-terracotta transition-colors hover:bg-sand"
                                >
                                  {t("cancel")}
                                </Link>
                              </>
                            ) : null}
                          </div>
                        </article>
                      );
                    })
                  )
                )}

                {activeTab === "templates" && (
                  rideTemplates.length === 0 ? (
                    <EmptyState
                      title={t("noRecurringRides")}
                      description={t("noRecurringRidesDescription")}
                      action={{ label: t("createRecurring"), href: `/${locale}/offri`, variant: "outline" }}
                    />
                  ) : (
                    rideTemplates.map((template) => (
                      <article
                        key={template.id}
                        className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-heading text-lg text-ink">
                              {template.from_city} — {template.to_city}
                            </h3>
                            <p className="mt-1 text-sm text-muted">
                              {template.time.slice(0, 5)} · {t("seatsCount", { count: template.seats })} · {template.price === 0 ? t("free") : `€${template.price}`}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {template.recurrence_days
                                .map((d) => new Date(2023, 0, d + 1).toLocaleDateString(locale, { weekday: "short" }))
                                .join(", ")}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                              template.is_active ? "bg-green-tint text-green" : "bg-sand-deep text-muted"
                            }`}
                          >
                            {template.is_active ? t("templateOn") : t("templateOff")}
                          </span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleToggleTemplate(template)}
                            disabled={togglingTemplateId === template.id}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-line text-sm font-medium text-ink transition-colors hover:bg-sand disabled:opacity-50"
                          >
                            {togglingTemplateId === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                            ) : template.is_active ? t("suspend") : t("activate")}
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deletingTemplateId === template.id}
                            aria-label={t("deleteRecurring")}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-terracotta transition-colors hover:bg-sand disabled:opacity-50"
                          >
                            {deletingTemplateId === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                            ) : (
                              <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                            )}
                          </button>
                        </div>
                      </article>
                    ))
                  )
                )}

                {activeTab === "alerts" && (
                  rideAlerts.length === 0 ? (
                    <EmptyState
                      title={t("noAlerts")}
                      description={t("noAlertsDescription")}
                      action={{ label: t("searchAndCreateAlert"), href: `/${locale}/cerca`, variant: "outline" }}
                    />
                  ) : (
                    rideAlerts.map((alert) => (
                      <article
                        key={alert.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5"
                      >
                        <div className="min-w-0">
                          <h3 className="font-heading text-base text-ink">
                            {alert.from_city || t("any")} → {alert.to_city || t("any")}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            {alert.start_date && `${t("fromDate")} ${formatDate(alert.start_date)}`}
                            {alert.end_date && ` ${t("toDate")} ${formatDate(alert.end_date)}`}
                            {alert.min_seats !== null && ` · ${t("min")} ${alert.min_seats}`}
                            {alert.max_price !== null && ` · ${t("max")} ${alert.max_price}€`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          disabled={deletingAlertId === alert.id}
                          aria-label={t("deleteAlert")}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-terracotta transition-colors hover:bg-sand disabled:opacity-50"
                        >
                          {deletingAlertId === alert.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                          ) : (
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                          )}
                        </button>
                      </article>
                    ))
                  )
                )}
              </div>
            </section>
          </div>

          {/* ── Settings rail ─────────────────────────────────── */}
          <aside className="min-w-0 space-y-4">
            <Panel title={t("railAccount")} id="account-panel">
              <div className="divide-y divide-line-soft">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      className={`h-5 w-5 shrink-0 ${emailConfirmed ? "text-green" : "text-muted"}`}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{t("email")}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{user?.email}</p>
                      <p className="mt-1 text-xs text-muted">
                        {emailConfirmed ? t("emailConfirmed") : t("emailNotConfirmed")}
                      </p>
                    </div>
                  </div>
                </div>

                <DisclosureRow icon={CreditCard} label={t("payments")} detail={t("paymentsDetail")}>
                  <StripeConnectBanner />
                </DisclosureRow>
              </div>
            </Panel>

            <Panel title={t("railVehicle")}>
              <div className="divide-y divide-line-soft">
                <LinkRow
                  href={`/${locale}/profilo/veicoli`}
                  icon={Car}
                  label={t("garageTitle")}
                  detail={t("garageDetail")}
                />
                <DisclosureRow
                  icon={Car}
                  label={t("yourVehicle")}
                  detail={profile?.car_model || t("vehicleNotSet")}
                >
                  <CarInfoForm
                    initialData={{
                      car_model: profile?.car_model,
                      car_color: profile?.car_color,
                      car_plate: profile?.car_plate,
                      car_year: profile?.car_year,
                    }}
                    onSave={handleSaveCarInfo}
                  />
                </DisclosureRow>
              </div>
            </Panel>

            <Panel title={t("railNotifications")}>
              <div className="divide-y divide-line-soft">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{t("pushNotifications")}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{t("pushDetail")}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <PushNotificationToggle />
                  </div>
                </div>

                {user && (
                  <DisclosureRow icon={Mail} label={t("emailNotifications")} detail={t("emailDetail")}>
                    <EmailPreferences userId={user.id} />
                  </DisclosureRow>
                )}
              </div>
            </Panel>

            <ReferralCard locale={locale} profile={profile} />

            <ShareApp variant="card" />

            <Panel>
              <div className="divide-y divide-line-soft">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex min-h-[56px] w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-sand"
                >
                  <LogOut className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                  <span className="flex-1 text-sm font-medium text-ink">{t("logout")}</span>
                </button>
                <Link
                  href={`/${locale}/elimina-account`}
                  className="flex min-h-[56px] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-sand"
                >
                  <Trash2 className="h-5 w-5 shrink-0 text-terracotta" strokeWidth={1.5} aria-hidden />
                  <span className="flex-1 text-sm font-medium text-terracotta">{t("deleteAccount")}</span>
                </Link>
              </div>
            </Panel>
          </aside>
        </div>

        {/* ── Dialogs ───────────────────────────────────────────── */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-modal flex items-end justify-center bg-[var(--bg-overlay)] p-4 sm:items-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-title"
              className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6"
            >
              <h2 id="logout-title" className="font-heading text-xl text-ink">{t("wantToLeave")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("loginAgainToUseApp")}</p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="min-h-[44px] flex-1 rounded-xl border border-line text-sm font-medium text-ink transition-colors hover:bg-sand"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="min-h-[44px] flex-1 rounded-xl bg-terracotta text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isLoggingOut ? <Loader2 className="mx-auto h-4 w-4 animate-spin" strokeWidth={1.5} /> : t("logout")}
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelBookingId && (
          <div className="fixed inset-0 z-modal flex items-end justify-center bg-[var(--bg-overlay)] p-4 sm:items-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-title"
              className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6"
            >
              <h2 id="cancel-title" className="font-heading text-xl text-ink">{t("cancelBookingTitle")}</h2>
              <label htmlFor="cancel-reason" className="mt-2 block text-sm leading-relaxed text-muted">
                {t("enterCancellationReason")}
              </label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-3 w-full resize-none rounded-xl border border-line bg-sand p-3 text-sm text-ink outline-none focus:border-green"
                rows={3}
                placeholder={t("reasonPlaceholder")}
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => { setCancelBookingId(null); setCancelReason(""); }}
                  className="min-h-[44px] flex-1 rounded-xl border border-line text-sm font-medium text-ink transition-colors hover:bg-sand"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim() || isCancelling}
                  className="min-h-[44px] flex-1 rounded-xl bg-terracotta text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isCancelling ? <Loader2 className="mx-auto h-4 w-4 animate-spin" strokeWidth={1.5} /> : t("confirm")}
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
    </ErrorBoundary>
  );
}
