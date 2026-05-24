import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getRideById,
  getRideStops,
  getDriverReviews,
  getSimilarRides,
  getRideBookingForUser,
} from "@/lib/server/data/rides";
import { RideDetailClient } from "@/components/ride-detail/RideDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function RideDetailPage({ params }: Props) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const [ride, user] = await Promise.all([
    getRideById(id),
    createClient().then((s) => s.auth.getUser().then((r) => r.data.user)),
  ]);

  if (!ride) {
    notFound();
  }

  const [stops, reviews, similarRides, existingBooking] = await Promise.all([
    getRideStops(id),
    getDriverReviews(ride.driver_id, 3),
    getSimilarRides(ride, 3),
    getRideBookingForUser(id, user?.id),
  ]);

  return (
    <RideDetailClient
      ride={ride}
      user={user}
      reviews={reviews}
      similarRides={similarRides}
      stops={stops}
      existingBooking={existingBooking}
      rideId={id}
      locale={locale}
    />
  );
}
