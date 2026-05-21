"use server";

import { createClient } from "@/lib/supabase/server";
import { isRideExpired } from "@/lib/date-utils";
import { checkServerRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notification-actions";

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Server-side free ride booking with full validation.
 * This is the single source of truth for free ride bookings.
 */
export async function bookFreeRide(
  rideId: string,
  passengerId: string
): Promise<BookingResult> {
  const supabase = await createClient();

  // Rate limit: max 10 bookings per 24h per user
  const { allowed } = await checkServerRateLimit(
    passengerId,
    "booking_request",
    10,
    24
  );
  if (!allowed) {
    return { success: false, error: "rate_limit" };
  }

  // Fetch ride with lock
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("id, driver_id, seats, date, time, status, from_city, to_city")
    .eq("id", rideId)
    .single();

  if (rideError || !ride) {
    return { success: false, error: "ride_not_found" };
  }

  // Critical validations
  if (ride.status === "cancelled") {
    return { success: false, error: "ride_cancelled" };
  }

  if (isRideExpired(ride.date, ride.time)) {
    return { success: false, error: "ride_expired" };
  }

  if (ride.driver_id === passengerId) {
    return { success: false, error: "cannot_book_own_ride" };
  }

  // Check for existing booking (any status except rejected)
  const { data: existing } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("ride_id", rideId)
    .eq("passenger_id", passengerId)
    .maybeSingle();

  if (existing && existing.status !== "rejected") {
    return { success: false, error: "already_booked" };
  }

  // Check seat availability with exact count
  const { count: confirmedCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("ride_id", rideId)
    .eq("status", "confirmed");

  if ((confirmedCount || 0) >= ride.seats) {
    return { success: false, error: "no_seats" };
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      ride_id: rideId,
      passenger_id: passengerId,
      status: "pending",
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    if (bookingError?.code === "23505") {
      return { success: false, error: "already_booked" };
    }
    return { success: false, error: "booking_failed" };
  }

  // Insert initial message
  await supabase.from("messages").insert({
    booking_id: booking.id,
    sender_id: passengerId,
    content: `Richiesta di prenotazione per ${ride.from_city} → ${ride.to_city}`,
    read: false,
  });

  // Send notification to driver (non-blocking)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const passengerName =
      user?.user_metadata?.name || user?.email?.split("@")[0] || "Passeggero";
    await createNotification({
      userId: ride.driver_id,
      type: "booking_request",
      title: "Nuova richiesta di prenotazione",
      body: `${passengerName} ha richiesto un posto per ${ride.from_city} → ${ride.to_city}`,
      rideId: rideId,
      bookingId: booking.id,
    });
  } catch {
    // Notification failure is non-blocking
  }

  return { success: true, bookingId: booking.id };
}
