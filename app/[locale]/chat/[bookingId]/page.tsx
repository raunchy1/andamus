import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

interface ChatPageProps {
  params: Promise<{
    locale: string;
    bookingId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { bookingId } = await params;
  const supabase = await createClient();

  // 1. Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/");
  }

  // 2. Fetch booking with all relations
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

  // 3. Check permissions — `rides` may come back as an object or single-row array.
  const ride = Array.isArray(booking.rides) ? booking.rides[0] : booking.rides;
  const isDriver = ride?.driver_id === user.id;
  const isPassenger = booking.passenger_id === user.id;

  if (!isDriver && !isPassenger) {
    redirect("/");
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 animate-spin text-[#e63946]" />
      </div>
    }>
      <ChatWindow bookingId={bookingId} booking={booking} user={user} />
    </Suspense>
  );
}
