'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeviceType } from "@/components/view-mode";
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
  router: ReturnType<typeof useRouter>;
}

interface HomeTranslations {
  kicker: string;
  headline: string;
  description: string;
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
  departuresConfirmed: string;
  close: string;
  savedRoutes: string;
  routeRemoved: string;
  routeRemoveError: string;
  howItWorksTitle: string;
  howItWorksStep1: string;
  howItWorksStep2: string;
  howItWorksStep3: string;
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
      router={props.router}
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
}: {
  locale: string;
  translations: HomeTranslations;
  initialRides: Ride[];
}) {
  const router = useRouter();
  const deviceType = useDeviceType();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [todayRides] = useState<Ride[]>(initialRides);
  const [loading] = useState(false);

  const props = {
    origin,
    setOrigin,
    destination,
    setDestination,
    todayRides,
    loading,
    router,
    locale,
    translations,
  };

  return (
    <>
      <div className={deviceType === "desktop" ? "block" : "hidden md:block"}>
        <HomeDesktop {...props} />
      </div>
      <div className={deviceType === "mobile" ? "block md:hidden" : "hidden"}>
        <HomeMobile {...props} />
      </div>
    </>
  );
}
