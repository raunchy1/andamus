'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCommuteSuggestion } from "@/lib/commute-suggestions";
import { Analytics } from "@/lib/analytics";
import { useDeviceType } from "@/components/view-mode";
import { LaunchBanner } from "@/components/LaunchBanner";
import { HomeMobileView } from "@/components/discovery/HomeMobileView";
import { HomeDesktopView } from "@/components/discovery/HomeDesktopView";


interface Ride {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
  };
}

interface HomeUIProps {
  origin: string;
  setOrigin: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  todayRides: Ride[];
  loading: boolean;
  userName: string;
  userAvatar: string | null;
  handleSearch: (e: React.FormEvent) => void;
  router: ReturnType<typeof useRouter>;
  savedRoutes: any[];
  suggestion: { from: string; to: string; reason: string } | null;
  signals: { ridesAddedToday: number; activeCommutersCount: number; trendingRoute: { from: string; to: string } | null } | null;
  showInlineOnboarding: boolean;
  setShowInlineOnboarding: (value: boolean) => void;
}

interface HomeTranslations {
  badge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroDescription: string;
  heroFree: string;
  heroFrom: string;
  heroTo: string;
  heroDate: string;
  heroSearchButton: string;
  heroCityPlaceholder: string;
  heroFromPlaceholder: string;
  todayRides: string;
  seeAll: string;
  today: string;
  free: string;
  car: string;
  noRidesToday: string;
  searchOtherDates: string;
  offerRide: string;
  yourTrips: string;
  departuresConfirmed: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  ctaTitle: string;
  ctaDescription: string;
  welcomeBack: string;
  savedRoutes: string;
  routeRemoved: string;
  routeRemoveError: string;
  gotIt: string;
  quickGuide: string;
  howItWorksTitle: string;
  howItWorksStep1: string;
  howItWorksStep2: string;
  howItWorksStep3: string;
  close: string;
}

interface HomeViewProps extends HomeUIProps {
  locale: string;
  translations: HomeTranslations;
}

function HomeMobile(props: HomeViewProps) {
  return (
    <HomeMobileView
      origin={props.origin}
      setOrigin={props.setOrigin}
      destination={props.destination}
      setDestination={props.setDestination}
      todayRides={props.todayRides}
      loading={props.loading}
      locale={props.locale}
      translations={props.translations}
      savedRoutes={props.savedRoutes}
      router={props.router}
      suggestion={props.suggestion}
      showInlineOnboarding={props.showInlineOnboarding}
      setShowInlineOnboarding={props.setShowInlineOnboarding}
    />
  );
}

function HomeDesktop(props: HomeViewProps) {
  return (
    <HomeDesktopView
      origin={props.origin}
      setOrigin={props.setOrigin}
      destination={props.destination}
      setDestination={props.setDestination}
      todayRides={props.todayRides}
      loading={props.loading}
      locale={props.locale}
      translations={props.translations}
      router={props.router}
    />
  );
}

export default function HomePageClient({
  locale,
  translations,
  initialRides,
  initialUserName,
  initialUserAvatar,
  initialSavedRoutes = [],
}: {
  locale: string;
  translations: HomeTranslations;
  initialRides: Ride[];
  initialUserName: string;
  initialUserAvatar: string | null;
  initialSavedRoutes?: any[];
}) {
  const router = useRouter();
  const deviceType = useDeviceType();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [todayRides] = useState<Ride[]>(initialRides);
  const [loading] = useState(false);
  const [userName] = useState(initialUserName);
  const [userAvatar] = useState(initialUserAvatar);
  const [suggestion, setSuggestion] = useState<{ from: string; to: string; reason: string } | null>(null);
  const [signals, setSignals] = useState<{ ridesAddedToday: number; activeCommutersCount: number; trendingRoute: { from: string; to: string } | null } | null>(null);
  const [showInlineOnboarding, setShowInlineOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSuggestion(getCommuteSuggestion());
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem("onboarding_done_v2");
      if (!done) {
        setShowInlineOnboarding(true);
      }
    }
  }, []);

  useEffect(() => {
    const trackActiveSession = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const client = createClient();
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          Analytics.trackSessionActive(user.created_at);
        }
      } catch {
        // Fail silently
      }
    };
    trackActiveSession();
  }, []);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch("/api/marketplace/signals");
        if (!response.ok) throw new Error("API error");
        const res = await response.json();
        setSignals(res);
      } catch {
        setSignals({
          ridesAddedToday: 3,
          activeCommutersCount: 16,
          trendingRoute: { from: "Cagliari", to: "Sassari" },
        });
      }
    };
    fetchSignals();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    router.push(`/${locale}/cerca?${params.toString()}`);
  };

  const props = {
    origin,
    setOrigin,
    destination,
    setDestination,
    todayRides,
    loading,
    userName,
    userAvatar,
    handleSearch,
    router,
    locale,
    translations,
    savedRoutes: initialSavedRoutes,
    suggestion,
    signals,
    showInlineOnboarding,
    setShowInlineOnboarding,
  };

  return (
    <>
      <LaunchBanner />
      <div className={deviceType === "desktop" ? "block" : "hidden md:block"}>
        <HomeDesktop {...props} />
      </div>
      <div className={deviceType === "mobile" ? "block md:hidden" : "hidden"}>
        <HomeMobile {...props} />
      </div>
    </>
  );
}
