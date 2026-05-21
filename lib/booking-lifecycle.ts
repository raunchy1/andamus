"use server";

import { createClient } from "@/lib/supabase/server";
import { isRideExpired } from "@/lib/date-utils";
import { createNotification } from "@/lib/notification-actions";
import { revalidatePath } from "next/cache";

export type LifecycleResult = {
  success: boolean;
  error?: string;
};

/**
 * Server action to accept a booking.
 * Verifies driver ownership, seat availability, and ride validity atomically.
 */
export async function acceptBooking(
  bookingId: string,
  rideId: string
): Promise<LifecycleResult> {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "unauthorized" };
  }

  // Fetch ride with driver verification
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("id, driver_id, seats, date, time, status, from_city, to_city")
    .eq("id", rideId)
    .single();

  if (rideError || !ride) {
    return { success: false, error: "ride_not_found" };
  }

  if (ride.driver_id !== user.id) {
    return { success: false, error: "not_driver" };
  }

  if (ride.status === "cancelled" || ride.status === "expired") {
    return { success: false, error: "ride_inactive" };
  }

  if (isRideExpired(ride.date, ride.time)) {
    return { success: false, error: "ride_expired" };
  }

  // Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status, passenger_id, payment_intent_id, payment_status")
    .eq("id", bookingId)
    .eq("ride_id", rideId)
    .single();

  if (bookingError || !booking) {
    return { success: false, error: "booking_not_found" };
  }

  if (booking.status !== "pending") {
    return { success: false, error: "booking_not_pending" };
  }

  // Atomic seat availability check
  const { count: confirmedCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("ride_id", rideId)
    .eq("status", "confirmed");

  if ((confirmedCount || 0) >= ride.seats) {
    return { success: false, error: "no_seats" };
  }

  // For paid rides, the payment must be authorized before accepting
  if (
    booking.payment_intent_id &&
    booking.payment_status !== "authorized"
  ) {
    return { success: false, error: "payment_not_ready" };
  }

  // Confirm booking
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);

  if (updateError) {
    console.error("[acceptBooking] update error:", updateError);
    return { success: false, error: "update_failed" };
  }

  // Notify passenger
  try {
    const { data: driverProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    await createNotification({
      userId: booking.passenger_id,
      type: "booking_accepted",
      title: "Passaggio confermato!",
      body: `${driverProfile?.name || "Il conducente"} ha accettato la tua richiesta per ${ride.from_city} → ${ride.to_city}`,
      rideId,
      bookingId,
    });
  } catch {
    // Notification failure is non-blocking
  }

  revalidatePath("/profilo");
  revalidatePath(`/corsa/${rideId}`);

  return { success: true };
}

/**
 * Server action to reject a booking.
 * Verifies driver ownership and handles Stripe cancellation for paid rides.
 */
export async function rejectBooking(
  bookingId: string,
  rideId: string
): Promise<LifecycleResult> {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "unauthorized" };
  }

  // Fetch ride with driver verification
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("id, driver_id, from_city, to_city")
    .eq("id", rideId)
    .single();

  if (rideError || !ride) {
    return { success: false, error: "ride_not_found" };
  }

  if (ride.driver_id !== user.id) {
    return { success: false, error: "not_driver" };
  }

  // Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status, passenger_id, payment_intent_id")
    .eq("id", bookingId)
    .eq("ride_id", rideId)
    .single();

  if (bookingError || !booking) {
    return { success: false, error: "booking_not_found" };
  }

  if (booking.status !== "pending") {
    return { success: false, error: "booking_not_pending" };
  }

  // For paid rides, cancel the Stripe authorization first
  if (booking.payment_intent_id) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/cancel-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        }
      );
      if (!res.ok) {
        console.error("[rejectBooking] Stripe cancel failed");
        // Continue anyway — we'll mark as rejected regardless
      }
    } catch {
      // Non-blocking
    }
  }

  // Reject booking
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("id", bookingId);

  if (updateError) {
    console.error("[rejectBooking] update error:", updateError);
    return { success: false, error: "update_failed" };
  }

  // Notify passenger
  try {
    const { data: driverProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    await createNotification({
      userId: booking.passenger_id,
      type: "booking_rejected",
      title: "Richiesta non accettata",
      body: `${driverProfile?.name || "Il conducente"} non può offrirti il passaggio per ${ride.from_city} → ${ride.to_city}`,
      rideId,
      bookingId,
    });
  } catch {
    // Non-blocking
  }

  revalidatePath("/profilo");
  revalidatePath(`/corsa/${rideId}`);

  return { success: true };
}
