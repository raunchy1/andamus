import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getRideById,
  getRideStops,
  getDriverReviews,
  getSimilarRides,
  getRideBookingForUser,
  type Ride,
  type RideStop,
  type Review,
} from "@/lib/server/data/rides";
import { getVehicleForRide } from "@/lib/server/data/vehicles";
import { RideDetailClient } from "@/components/ride-detail/RideDetailClient";
import type { VehicleWithImages } from "@/lib/types/vehicle";
import { isRideExpired } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

const unavailableCopy = {
  it: {
    title: "Questa corsa non è disponibile",
    description: "Potrebbe essere stata rimossa, annullata o essere già partita.",
  },
  en: {
    title: "This ride is unavailable",
    description: "It may have been removed, cancelled, or has already departed.",
  },
  de: {
    title: "Diese Fahrt ist nicht verfügbar",
    description: "Sie wurde möglicherweise entfernt, abgesagt oder ist bereits abgefahren.",
  },
} as const;

function getUnavailableCopy(locale: string) {
  return unavailableCopy[locale as keyof typeof unavailableCopy] ?? unavailableCopy.it;
}

export default async function RideDetailPage({ params }: Props) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  // Fetch the actual ride and the current user. A failed/missing lookup is never
  // replaced with made-up route, driver, availability, or reviews data.
  const [dbRide, user] = await Promise.all([
    getRideById(id).catch(err => {
      console.error("getRideById failed:", err);
      return null;
    }),
    createClient()
      .then((s) => s.auth.getUser().then((r) => r.data.user))
      .catch(() => null),
  ]);

  if (!dbRide || dbRide.status !== "active" || isRideExpired(dbRide.date, dbRide.time)) {
    const t = await getTranslations({ locale, namespace: "ride" });
    const copy = getUnavailableCopy(locale);

    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-fg">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted">{copy.description}</p>
        <Link
          href={`/${locale}/cerca`}
          className="mt-6 inline-flex w-fit rounded-[var(--radius-sm)] bg-fg px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          {t("backToSearch")}
        </Link>
      </main>
    );
  }

  const ride = dbRide;

  // Fetch only details saved for this ride and driver.
  let stops: RideStop[] = [];
  let reviews: Review[] = [];
  let similarRides: Ride[] = [];
  let existingBooking: Awaited<ReturnType<typeof getRideBookingForUser>> = null;
  let vehicle: VehicleWithImages | null = null;

  try {
    const rideWithVehicle = ride as { vehicle_id?: string | null };
    const [stopsRes, reviewsRes, similarRidesRes, existingBookingRes, vehicleRes] = await Promise.all([
      getRideStops(id).catch(() => []),
      getDriverReviews(ride.driver_id, 3).catch(() => []),
      getSimilarRides(ride, 3).catch(() => []),
      getRideBookingForUser(id, user?.id).catch(() => null),
      rideWithVehicle.vehicle_id
        ? getVehicleForRide(rideWithVehicle.vehicle_id).catch(() => null)
        : Promise.resolve(null),
    ]);
    stops = stopsRes;
    reviews = reviewsRes;
    similarRides = similarRidesRes;
    existingBooking = existingBookingRes;
    vehicle = vehicleRes;
  } catch (err) {
    console.error("Secondary details fetch failed in RideDetailPage:", err);
  }

  return (
    <RideDetailClient
      ride={ride}
      user={user}
      reviews={reviews}
      similarRides={similarRides}
      stops={stops}
      existingBooking={existingBooking}
      vehicle={vehicle}
      rideId={id}
      locale={locale}
    />
  );
}
