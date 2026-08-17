import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BookingClient } from "@/components/booking/BookingClient";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/join?next=/${locale}/corsa/${id}/prenotazione`);
  }

  const { data: ride } = await supabase
    .from("rides")
    .select(
      "id, driver_id, from_city, to_city, date, time, seats, price, meeting_point, profiles!rides_driver_id_fkey(name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!ride) notFound();

  // non si può prenotare il proprio passaggio
  if (ride.driver_id === user.id) {
    redirect(`/${locale}/corsa/${id}`);
  }

  const driverName =
    (Array.isArray(ride.profiles) ? ride.profiles[0]?.name : (ride.profiles as { name?: string })?.name) ??
    "Il conducente";

  return (
    <BookingClient
      locale={locale}
      rideId={ride.id}
      fromCity={ride.from_city}
      toCity={ride.to_city}
      date={ride.date}
      time={ride.time}
      price={ride.price}
      maxSeats={ride.seats}
      meetingPoint={ride.meeting_point}
      driverName={driverName}
    />
  );
}
