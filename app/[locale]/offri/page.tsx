"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, Check, ArrowLeft, Car } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { completeGamificationAction } from "@/lib/gamification";
import { createRide } from "@/lib/ride-actions";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useDeviceType } from "@/components/view-mode";
import { ShareRide } from "@/components/ShareRide";
import { CelebrationModal } from "@/components/FirstRideCelebration";
import dynamic from "next/dynamic";

const PostActionModal = dynamic(() => import("@/components/PostActionModal").then(m => m.PostActionModal), { ssr: false });
import { Analytics } from "@/lib/analytics";
import { getFriendlyErrorMessage } from "@/lib/client/error-handler";
import { OfferMobile, OfferDesktop } from "@/components/offri/OfferFormViews";
import { Button } from "@/components/ui/button";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/** "2026-08-27" → "mer 27 ago", in the reader's language. */
function formatRideDate(date: string, locale: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function OfferPage() {
  const t = useTranslations('offer');
  const locale = useLocale();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const deviceType = useDeviceType();
  
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
    seats: "",
    isFree: true,
    price: "",
    meetingPoint: "",
    notes: "",
    smokingAllowed: false,
    petsAllowed: false,
    largeLuggage: false,
    musicPreference: "",
    womenOnly: false,
    studentsOnly: false,
    isRecurring: false,
    recurrenceDays: [] as number[],
    stops: [] as string[],
    // Car info
    useSavedCar: true,
    carModel: "",
    carColor: "",
    carPlate: "",
    carYear: "",
  });
  
  // User's saved car info
  const [savedCarInfo, setSavedCarInfo] = useState<{
    car_model?: string | null;
    car_color?: string | null;
    car_plate?: string | null;
    car_year?: number | null;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFirstRide, setIsFirstRide] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPostAction, setShowPostAction] = useState(false);
  const [publishedRideId, setPublishedRideId] = useState<string | null>(null);
  const [publishedRideData, setPublishedRideData] = useState<{
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  
  // Refs to track form values without triggering effect re-runs
  const priceRef = useRef(formData.price);
  const isFreeRef = useRef(formData.isFree);
  
  // Update refs when values change
  useEffect(() => {
    priceRef.current = formData.price;
    isFreeRef.current = formData.isFree;
  }, [formData.price, formData.isFree]);

  const today = new Date().toISOString().split("T")[0];
  const [supabase] = useState(() => createClient());

  // Intelligent Price Calculator using Google Maps Distance Matrix API
  useEffect(() => {
    const calculateDistanceAndPrice = async () => {
      if (!formData.origin || !formData.destination || formData.origin === formData.destination) {
        setSuggestedPrice(null);
        setDistanceKm(null);
        return;
      }

      setCalculatingPrice(true);
      
      try {
        const response = await fetch('/api/maps/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: `${formData.origin}, Sardegna, Italia`,
            destination: `${formData.destination}, Sardegna, Italia`,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Distance calculation failed');
        }
        
        const data = await response.json();
        
        if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0].distance) {
          const distanceInMeters = data.rows[0].elements[0].distance.value;
          const distanceInKm = Math.round(distanceInMeters / 1000);
          setDistanceKm(distanceInKm);
          
          // Pricing algorithm: €0.09 per km, minimum €2
          const calculatedPrice = Math.round(distanceInKm * 0.09);
          const finalPrice = Math.max(2, calculatedPrice);
          
          setSuggestedPrice(finalPrice);
          
          // Auto-fill price if not already set (use refs to avoid dependency issues)
          if (!priceRef.current && !isFreeRef.current) {
            setFormData(prev => ({ ...prev, price: finalPrice.toString() }));
          }
        } else {
          // Fallback to local estimation if API fails
          setDistanceKm(null);
          setSuggestedPrice(null);
        }
      } catch {
        // Price calculation error
        setDistanceKm(null);
        setSuggestedPrice(null);
      } finally {
        setCalculatingPrice(false);
      }
    };

    calculateDistanceAndPrice();
  }, [formData.origin, formData.destination]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Load saved car info if user is logged in
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("car_model, car_color, car_plate, car_year")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setSavedCarInfo(profile);
          // Pre-fill form with saved car
          setFormData(prev => ({
            ...prev,
            carModel: profile.car_model || "",
            carColor: profile.car_color || "",
            carPlate: profile.car_plate || "",
            carYear: profile.car_year?.toString() || "",
          }));
        }
      }
      
      setAuthLoading(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: import("@supabase/supabase-js").AuthChangeEvent, session: import("@supabase/supabase-js").Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleChange = (field: string, value: string | boolean | number[] | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
    }
    if (field === "origin" || field === "destination") {
      if (errors.sameCity) {
        setErrors(prev => { const newErrors = { ...prev }; delete newErrors.sameCity; return newErrors; });
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.origin) newErrors.origin = t('errorOriginRequired');
    if (!formData.destination) newErrors.destination = t('errorDestinationRequired');
    if (formData.origin && formData.destination && formData.origin === formData.destination) {
      newErrors.sameCity = t('errors.sameCity');
    }
    if (!formData.date) {
      newErrors.date = t('errorDateRequired');
    } else if (formData.date < today) {
      newErrors.date = t('errorDatePast') || 'La data non può essere nel passato';
    }
    if (!formData.time) newErrors.time = t('errorTimeRequired');
    if (!formData.seats) {
      newErrors.seats = t('errorSeatsRequired');
    } else {
      const seatsNum = parseInt(formData.seats, 10);
      if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 8) {
        newErrors.seats = t('errorSeatsRange') || 'Il numero di posti deve essere tra 1 e 8';
      }
    }
    if (!formData.isFree && !formData.price) newErrors.price = t('errorPriceRequired');
    if (formData.musicPreference && !['quiet','music','talk'].includes(formData.musicPreference)) {
      newErrors.musicPreference = t('errorMusicPreference');
    }
    if (formData.isRecurring && formData.recurrenceDays.length === 0) {
      newErrors.recurrenceDays = t('errorRecurrenceDays');
    }
    if (formData.stops.some((s) => s === formData.origin || s === formData.destination)) {
      newErrors.stops = t('errorStops');
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError("");
    
    // Validate form with toast feedback
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.values(validationErrors);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0]);
      } else {
        toast.error(t('fillRequiredFields'));
      }
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast.error(t('authRequired'));
      setSubmitError(t('authRequired'));
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(formData.isRecurring ? t('creating') : t('publishing'));

    try {
      // Check if this is the user's first ride BEFORE inserting
      const { count: rideCount } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', currentUser.id);
      const firstRide = (rideCount || 0) === 0;
      setIsFirstRide(firstRide);

      let rideId: string | null = null;

      if (formData.isRecurring) {
        const { error: templateError } = await supabase
          .from("ride_templates")
          .insert({
            user_id: currentUser.id,
            from_city: formData.origin,
            to_city: formData.destination,
            time: formData.time,
            seats: parseInt(formData.seats),
            price: formData.isFree ? 0 : parseFloat(formData.price),
            meeting_point: formData.meetingPoint || null,
            notes: formData.notes || null,
            preferences: {
              smoking_allowed: formData.smokingAllowed || null,
              pets_allowed: formData.petsAllowed || null,
              large_luggage: formData.largeLuggage || null,
              music_preference: formData.musicPreference || null,
              women_only: formData.womenOnly || null,
              students_only: formData.studentsOnly || null,
            },
            recurrence_days: formData.recurrenceDays,
          });

        if (templateError) {
          // Template error logged silently
          toast.dismiss(toastId);
          toast.error(t('errorTemplate', { message: templateError.message }));
          setSubmitError(t('errorPublishing', { message: templateError.message }));
          setIsSubmitting(false);
          return;
        }

        const { error: rpcError } = await supabase.rpc("generate_rides_from_templates", { p_days_ahead: 30 });
        
        if (rpcError) {
          toast.dismiss(toastId);
          toast.error(t('errorGeneratingRides', { message: rpcError.message }));
          setSubmitError(t('errorPublishing', { message: rpcError.message }));
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = await createRide({
          from_city: formData.origin,
          to_city: formData.destination,
          date: formData.date,
          time: formData.time,
          seats: parseInt(formData.seats),
          price: formData.isFree ? 0 : parseFloat(formData.price),
          meeting_point: formData.meetingPoint || null,
          notes: formData.notes || null,
          smoking_allowed: formData.smokingAllowed || null,
          pets_allowed: formData.petsAllowed || null,
          large_luggage: formData.largeLuggage || null,
          music_preference: formData.musicPreference || null,
          women_only: formData.womenOnly || null,
          students_only: formData.studentsOnly || null,
          car_model: formData.carModel || savedCarInfo?.car_model || null,
          car_color: formData.carColor || savedCarInfo?.car_color || null,
          car_plate: formData.carPlate || savedCarInfo?.car_plate || null,
          car_year: formData.carYear ? parseInt(formData.carYear) : savedCarInfo?.car_year || null,
          stops: formData.stops,
        });

        rideId = result.rideId;

        if (rideId) {
          fetch("/api/alerts/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rideId }),
          }).catch(() => {});
        }
      }
      
      if (currentUser) {
        // firstRide was determined BEFORE the insert to avoid race condition
        const result = await completeGamificationAction(
          currentUser.id,
          'ride_published',
          firstRide
        );
        
        if (result.pointsAdded > 0) {
          toast.dismiss(toastId);
          toast.success(t('pointsEarned', { points: result.pointsAdded }));
          if (result.leveledUp) {
            toast.success(t('levelUp', { level: result.newLevel ?? '' }));
          }
        } else {
          toast.dismiss(toastId);
          toast.success(formData.isRecurring ? t('recurringSuccess') : t('rideSuccess'));
        }
      } else {
        toast.dismiss(toastId);
        toast.success(formData.isRecurring ? t('recurringSuccess') : t('rideSuccess'));
      }
      
      setPublishedRideId(rideId);
      setPublishedRideData({
        from_city: formData.origin,
        to_city: formData.destination,
        date: formData.date,
        time: formData.time,
        price: formData.isFree ? 0 : Number(formData.price) || 0,
      });
      setIsSubmitted(true);
      if (isFirstRide) {
        setShowCelebration(true);
      } else {
        setShowPostAction(true);
      }
      Analytics.rideCreated(formData.origin, formData.destination);
    } catch (err: any) {
      // Submit error logged silently
      toast.dismiss(toastId);
      const friendlyMsg = getFriendlyErrorMessage(err, t('unexpectedError'));
      toast.error(friendlyMsg);
      setSubmitError(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.method === "gis") {
        window.location.reload();
      }
    } catch {
      // ignore
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="size-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-bg px-5">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <div className="flex size-13 items-center justify-center rounded-2xl bg-accent-dim">
            <Car className="size-6 text-accent" strokeWidth={1.6} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.03em] text-ink">
              {t("login.title")}
            </h1>
            <p className="text-[15px] leading-relaxed text-muted">{t("login.body")}</p>
          </div>
          <Button type="button" onClick={handleLogin} className="w-full">
            {t("login.google")}
          </Button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            {t("success.backHome")}
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col bg-bg px-5 pb-10 pt-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3.5">
            <div className="flex size-13 items-center justify-center rounded-full bg-accent">
              <Check className="size-6 text-accent-fg" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[30px] font-bold leading-tight tracking-[-0.03em] text-ink">
                {t("success.title")}
              </h1>
              <p className="text-[15px] leading-relaxed text-muted">
                {isFirstRide ? t("success.firstRide") : t("success.subtitle")}
              </p>
            </div>
          </div>

          {publishedRideData && (
            <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
                  {formatRideDate(publishedRideData.date, locale)} · {publishedRideData.time}
                </span>
                <span className="text-[15px] font-bold text-ink">
                  {publishedRideData.price > 0 ? `${publishedRideData.price} €` : t("summaryFree")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex flex-col items-center gap-[3px]">
                  <span className="size-2 rounded-full border-2 border-accent" />
                  <span className="h-[22px] w-px bg-line" />
                  <span className="size-2 rounded-full bg-accent" />
                </span>
                <span className="flex flex-1 flex-col gap-3.5">
                  <span className="text-base font-semibold leading-none text-ink">
                    {publishedRideData.from_city}
                  </span>
                  <span className="text-base font-semibold leading-none text-ink">
                    {publishedRideData.to_city}
                  </span>
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <h2 className="text-[15px] font-semibold text-ink">{t("success.shareTitle")}</h2>
            {publishedRideId && publishedRideData && (
              <ShareRide
                ride={{
                  id: publishedRideId,
                  from_city: publishedRideData.from_city,
                  to_city: publishedRideData.to_city,
                  date: publishedRideData.date,
                  time: publishedRideData.time,
                  price: publishedRideData.price,
                }}
                variant="card"
                className="w-full justify-center"
              />
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2.5 pt-6">
            <Button
              type="button"
              onClick={() =>
                window.location.assign(publishedRideId ? `/corsa/${publishedRideId}` : "/profilo")
              }
              className="w-full"
            >
              {t("success.view")}
            </Button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-12 items-center justify-center text-base font-semibold text-muted transition-colors hover:text-ink"
            >
              {t("success.again")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const commonProps = {
    user,
    formData,
    errors,
    submitError,
    isSubmitting,
    suggestedPrice,
    distanceKm,
    calculatingPrice,
    today,
    handleChange,
    handleSubmit,
    savedCarInfo,
  };

  return (
    <>
      {deviceType === "desktop" ? <OfferDesktop {...commonProps} /> : <OfferMobile {...commonProps} />}
      {showCelebration && (
        <CelebrationModal
          type="first_ride"
          onClose={() => setShowCelebration(false)}
        />
      )}
      {showPostAction && publishedRideId && publishedRideData && (
        <PostActionModal
          type="ride_published"
          open={showPostAction}
          onClose={() => setShowPostAction(false)}
          context={{
            rideId: publishedRideId,
            fromCity: publishedRideData.from_city,
            toCity: publishedRideData.to_city,
            date: publishedRideData.date,
            time: publishedRideData.time,
            price: publishedRideData.price,
          }}
        />
      )}
    </>
  );
}
