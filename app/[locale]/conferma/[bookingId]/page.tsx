import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; bookingId: string }>;
}) {
  const { locale, bookingId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/join`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, passenger_id, rides(id, from_city, to_city, date, time, meeting_point, profiles!rides_driver_id_fkey(name))"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) notFound();

  // solo il passeggero può vedere la propria conferma
  if (booking.passenger_id !== user.id) notFound();

  const ride = Array.isArray(booking.rides) ? booking.rides[0] : booking.rides;
  if (!ride) notFound();

  const driverProfile = Array.isArray(ride.profiles) ? ride.profiles[0] : ride.profiles;

  return (
    <BookingConfirmation
      locale={locale}
      bookingId={booking.id}
      fromCity={ride.from_city}
      toCity={ride.to_city}
      date={ride.date}
      time={ride.time}
      meetingPoint={ride.meeting_point}
      driverName={driverProfile?.name ?? "Il conducente"}
    />
  );
}
