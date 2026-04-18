import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";

interface ChatPageProps {
  params: {
    locale: string;
    bookingId: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { bookingId } = params;
  const supabase = await createClient();

  // 1. Verificăm autentificarea
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/");
  }

  // 2. Preluăm booking-ul cu toate relațiile
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      `
      *,
      rides(
        from_city,
        to_city,
        date,
        time,
        driver_id,
        profiles(name, avatar_url)
      ),
      passenger:profiles!bookings_passenger_id_fkey(name, avatar_url)
    `
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    redirect("/");
  }

  // 3. Verificăm permisiunile
  const isDriver = booking.rides.driver_id === user.id;
  const isPassenger = booking.passenger_id === user.id;

  if (!isDriver && !isPassenger) {
    redirect("/");
  }

  return <ChatWindow bookingId={bookingId} booking={booking} user={user} />;
}
