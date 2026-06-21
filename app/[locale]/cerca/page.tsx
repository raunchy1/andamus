"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, RefreshCw, Bell, SlidersHorizontal, X, User, Search, Car, Star, ChevronRight, BadgeCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useDeviceType } from "@/components/view-mode";
import { getFriendlyErrorMessage } from "@/lib/client/error-handler";
import { searchRides } from "@/lib/rides-actions";
import { Slider } from "@/components/ui/slider";
import { LocationCombobox } from "@/components/LocationCombobox";
import { EmptyStateSearch } from "@/components/EmptyState";
import { TrustBadge } from "@/components/TrustBadge";
import { Analytics } from "@/lib/analytics";
import { trackSearchInHistory } from "@/lib/commute-suggestions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RideCardSkeleton } from "@/components/cerca/RideCardSkeleton";
import { PremiumRideCard } from "@/components/cerca/PremiumRideCard";
import { AlertModal } from "@/components/cerca/AlertModal";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import { AuroraBackground } from "@/components/ui/premium/aurora-background";
import { OrbGlow } from "@/components/ui/premium/orb-glow";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { MagneticButton } from "@/components/ui/premium/magnetic-button";
import { TiltCard } from "@/components/ui/premium/tilt-card";
import { CreateRequestModal } from "@/components/CreateRequestModal";
import { SearchMobileView } from "@/components/discovery/search-mobile-view";
import { SearchDesktopView } from "@/components/discovery/search-desktop-view";


function getFilterOptions(t: (key: string) => string) {
  return [
    { id: "all", label: t('filterAll') },
    { id: "free", label: t('filterFree') },
    { id: "verified", label: t('filterVerified') },
    { id: "today", label: t('filterToday') },
  ];
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
  created_at?: string;
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
    review_count?: number | null;
    rides_count?: number | null;
    completed_rides_count?: number | null;
  };
}

interface SearchViewProps {
  activeFilter: string;
  setActiveFilter: (v: string) => void;
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  timeWindow: string;
  setTimeWindow: (v: string) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  minSeats: number | null;
  setMinSeats: (v: number | null) => void;
  onlyVerified: boolean;
  setOnlyVerified: (v: boolean) => void;
  prefSmoking: boolean;
  setPrefSmoking: (v: boolean) => void;
  prefPets: boolean;
  setPrefPets: (v: boolean) => void;
  prefLuggage: boolean;
  setPrefLuggage: (v: boolean) => void;
  prefWomen: boolean;
  setPrefWomen: (v: boolean) => void;
  prefStudents: boolean;
  setPrefStudents: (v: boolean) => void;
  prefMusic: string;
  setPrefMusic: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  isRefreshing: boolean;
  setIsRefreshing: (v: boolean) => void;
  showAlertModal: boolean;
  setShowAlertModal: (v: boolean) => void;
  alertSaving: boolean;
  setAlertSaving: (v: boolean) => void;
  pullStartY: number;
  setPullStartY: (v: number) => void;
  pullDistance: number;
  setPullDistance: (v: number) => void;
  rides: Ride[];
  loading: boolean;
  hasError: boolean;
  today: string;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  fetchRides: () => Promise<void>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => Promise<void>;
  handleTouchCancel: () => void;
  handleRefresh: () => Promise<void>;
  handleSearch: (e: React.FormEvent) => void;
  clearFilters: () => void;
  formatDate: (dateStr: string) => string;
  activeFiltersCount: number;
  supabase: ReturnType<typeof createClient>;
  showCreateModal?: boolean;
  setShowCreateModal?: (v: boolean) => void;
}


function SearchMobile(props: SearchViewProps) {
  return <SearchMobileView {...props} />;
}

function SearchDesktop(props: SearchViewProps) {
  return <SearchDesktopView {...props} />;
}

function SearchContent() {
  const t = useTranslations('search');
  const searchErrorText = t('searchError');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceType = useDeviceType();

  const [activeFilter, setActiveFilter] = useState("all");
  const [origin, setOrigin] = useState(searchParams.get("from") || "");
  const [destination, setDestination] = useState(searchParams.get("to") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date") || "");
  const [dateTo, setDateTo] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [minSeats, setMinSeats] = useState<number | null>(null);
  const [onlyVerified, setOnlyVerified] = useState(searchParams.get("verified") === "true");
  const [prefSmoking, setPrefSmoking] = useState(false);
  const [prefPets, setPrefPets] = useState(false);
  const [prefLuggage, setPrefLuggage] = useState(false);
  const [prefWomen, setPrefWomen] = useState(searchParams.get("women") === "true");
  const [prefStudents, setPrefStudents] = useState(searchParams.get("students") === "true");
  const [prefMusic, setPrefMusic] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  // Fix #4: track error state so the error UI is shown instead of empty state
  const [hasError, setHasError] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const [supabase] = useState(() => createClient());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Fix #1: sync filter state back into the URL so browser Back restores them.
  // We use replace (not push) to avoid polluting the history stack on every
  // keystroke — only the current entry is updated.
  const syncUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    if (dateFrom) params.set("date", dateFrom);
    if (activeFilter !== "all") params.set("filter", activeFilter);
    const qs = params.toString();
    router.replace(`/${locale}/cerca${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [origin, destination, dateFrom, activeFilter, locale, router]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const results = await searchRides({
        origin: origin || undefined,
        destination: destination || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        timeWindow: (timeWindow as "morning" | "afternoon" | "evening" | "night" | "") || undefined,
        maxPrice: maxPrice > 0 ? maxPrice : undefined,
        minSeats: minSeats ?? undefined,
        smoking: prefSmoking || undefined,
        pets: prefPets || undefined,
        luggage: prefLuggage || undefined,
        womenOnly: prefWomen || undefined,
        studentsOnly: prefStudents || undefined,
        musicPreference: prefMusic || undefined,
        verifiedOnly: (activeFilter === "verified" || onlyVerified) || undefined,
        freeOnly: activeFilter === "free" || undefined,
        todayOnly: activeFilter === "today" || undefined,
      });
      if (!isMountedRef.current) return;
      setRides(results as Ride[]);

      // Phase 5 Search Conversion Telemetry & PWA Signal
      if (results && results.length > 0) {
        Analytics.trackEvent("first_search_success", {
          origin: origin || undefined,
          destination: destination || undefined,
          results_count: results.length,
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("successful_search"));
        }
      } else {
        Analytics.trackEvent("empty_searches", {
          origin: origin || undefined,
          destination: destination || undefined,
        });
      }

      if (origin || destination) {
        Analytics.searchPerformed(origin, destination);

        // Log search telemetry asynchronously
        fetch("/api/cerca/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_city: origin || "Tutte",
            to_city: destination || "Tutte",
            date: dateFrom || null,
            results_count: results ? results.length : 0,
            device_type: typeof window !== "undefined" ? (window.innerWidth < 768 ? "mobile" : "desktop") : "unknown",
          }),
        }).catch(() => {});

        if (origin && destination) {
          trackSearchInHistory(origin, destination);
        }
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setHasError(true);
      toast.error(err instanceof Error ? err.message : searchErrorText);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [activeFilter, dateFrom, dateTo, timeWindow, destination, maxPrice, minSeats, onlyVerified, origin, prefLuggage, prefMusic, prefPets, prefSmoking, prefStudents, prefWomen, searchErrorText]);

  // Fix #2: single debounced effect — removed the redundant immediate useEffect
  // that was causing a double fetch on every mount. fetchRides fires once after
  // 400 ms on the initial render, and again whenever its deps change.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRides();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchRides]);

  // Fix #1: keep the URL in sync whenever key filter state changes.
  useEffect(() => {
    syncUrlParams();
  }, [syncUrlParams]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (resultsRef.current && resultsRef.current.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0 && resultsRef.current && resultsRef.current.scrollTop === 0) {
      const diff = e.touches[0].clientY - pullStartY;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, 80));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await fetchRides();
      if (isMountedRef.current) setIsRefreshing(false);
    }
    if (isMountedRef.current) {
      setPullStartY(0);
      setPullDistance(0);
    }
  };

  const handleTouchCancel = () => {
    if (isMountedRef.current) {
      setPullStartY(0);
      setPullDistance(0);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRides();
    setIsRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRides();
  };

  const clearFilters = () => {
    setOrigin("");
    setDestination("");
    setDateFrom("");
    setDateTo("");
    setTimeWindow("");
    setMaxPrice(50);
    setMinSeats(null);
    setOnlyVerified(false);
    setPrefSmoking(false);
    setPrefPets(false);
    setPrefLuggage(false);
    setPrefWomen(false);
    setPrefStudents(false);
    setPrefMusic("");
    setActiveFilter("all");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const isToday = dateStr === today;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const isTomorrow = dateStr === tomorrow;

    if (isToday) return t('today');
    if (isTomorrow) return t('tomorrow');

    return date.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  };

  const activeFiltersCount =
    (origin ? 1 : 0) +
    (destination ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (timeWindow ? 1 : 0) +
    (maxPrice > 0 && maxPrice < 50 ? 1 : 0) +
    (minSeats !== null ? 1 : 0) +
    (onlyVerified ? 1 : 0) +
    (prefSmoking ? 1 : 0) +
    (prefPets ? 1 : 0) +
    (prefLuggage ? 1 : 0) +
    (prefWomen ? 1 : 0) +
    (prefStudents ? 1 : 0) +
    (prefMusic ? 1 : 0);

  const sharedProps: SearchViewProps = {
    activeFilter, setActiveFilter,
    origin, setOrigin,
    destination, setDestination,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    timeWindow, setTimeWindow,
    maxPrice, setMaxPrice,
    minSeats, setMinSeats,
    onlyVerified, setOnlyVerified,
    prefSmoking, setPrefSmoking,
    prefPets, setPrefPets,
    prefLuggage, setPrefLuggage,
    prefWomen, setPrefWomen,
    prefStudents, setPrefStudents,
    prefMusic, setPrefMusic,
    showFilters, setShowFilters,
    isRefreshing, setIsRefreshing,
    showAlertModal, setShowAlertModal,
    alertSaving, setAlertSaving,
    pullStartY, setPullStartY,
    pullDistance, setPullDistance,
    rides, loading, hasError,
    today,
    resultsRef,
    fetchRides,
    handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel,
    handleRefresh,
    handleSearch,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
    showCreateModal,
    setShowCreateModal,
  };

  if (deviceType === "mobile") {
    return (
      <>
        <SearchMobile {...sharedProps} />
        <CreateRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          initialFrom={origin}
          initialTo={destination}
          initialDate={dateFrom}
        />
      </>
    );
  }
  return (
    <>
      <SearchDesktop {...sharedProps} />
      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialFrom={origin}
        initialTo={destination}
        initialDate={dateFrom}
      />
    </>
  );
}

// Fix #9: SearchContent uses useSearchParams and useRouter which require a
// Suspense boundary in Next.js 16. SearchPage provides that boundary.
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-bg">
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen bg-bg pt-16 pb-24">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
              <div className="mb-8">
                <div className="h-5 w-32 mb-2 bg-white/[0.06] rounded-lg animate-pulse" />
                <div className="h-9 w-24 bg-white/[0.08] rounded-lg animate-pulse" />
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mb-6">
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 w-full bg-white/[0.05] rounded-lg animate-pulse" />
                  <div className="h-10 w-full bg-white/[0.05] rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2 mb-8 overflow-hidden">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="h-8 rounded-full flex-shrink-0 bg-white/[0.05] animate-pulse w-20" />
                ))}
              </div>
              <div className="space-y-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 sm:p-6 animate-pulse h-48" />
                ))}
              </div>
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
