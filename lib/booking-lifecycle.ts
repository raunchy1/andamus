"use server";

import { createClient } from "@/lib/supabase/server";
import { isRideExpired } from "@/lib/date-utils";
import { createNotification } from "@/lib/notification-actions";
import { revalidatePath } from "next/cache";
import { refundBooking } from "@/lib/server/payments/refund";

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

  // For paid rides, release the Stripe authorization first.
  // Called directly rather than over HTTP: a server-to-server fetch would not
  // carry the driver's session cookies and would be rejected as unauthorized.
  if (booking.payment_intent_id) {
    try {
      const result = await refundBooking(supabase, bookingId, user.id);
      if (!result.ok) {
        console.error("[rejectBooking] Stripe cancel failed:", result.error);
        // Continue anyway — we'll mark as rejected regardless
      }
    } catch (err) {
      console.error("[rejectBooking] Stripe cancel threw:", err);
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

/**
 * Server action to cancel an entire ride.
 * Refunds all confirmed bookings, cancels authorized ones, notifies all passengers.
 */
export async function cancelRide(rideId: string): Promise<LifecycleResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "unauthorized" };
  }

  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("id, driver_id, from_city, to_city, status")
    .eq("id", rideId)
    .single();

  if (rideError || !ride) {
    return { success: false, error: "ride_not_found" };
  }

  if (ride.driver_id !== user.id) {
    return { success: false, error: "not_driver" };
  }

  if (ride.status === "cancelled") {
    return { success: false, error: "already_cancelled" };
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, passenger_id, payment_intent_id, payment_status, status")
    .eq("ride_id", rideId)
    .in("status", ["pending", "confirmed"]);

  const refundErrors: string[] = [];
  for (const booking of bookings ?? []) {
    if (booking.payment_intent_id) {
      try {
        const result = await refundBooking(supabase, booking.id, user.id);
        if (!result.ok) {
          refundErrors.push(`booking ${booking.id}: ${result.error}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        refundErrors.push(`booking ${booking.id}: ${msg}`);
      }
    }

    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);

    try {
      await createNotification({
        userId: booking.passenger_id,
        type: "booking_rejected",
        title: "Passaggio annullato",
        body: `Il conducente ha annullato il passaggio ${ride.from_city} → ${ride.to_city}. Il rimborso è in arrivo.`,
        rideId,
        bookingId: booking.id,
      });
    } catch {
      // Non-blocking
    }
  }

  const { error: rideUpdateError } = await supabase
    .from("rides")
    .update({ status: "cancelled" })
    .eq("id", rideId);

  if (rideUpdateError) {
    return { success: false, error: "update_failed" };
  }

  revalidatePath("/profilo");
  revalidatePath(`/corsa/${rideId}`);

  if (refundErrors.length > 0) {
    console.error("[cancelRide] Refund errors:", refundErrors);
    return { success: true, error: "partial_refund_failure" };
  }

  return { success: true };
}
