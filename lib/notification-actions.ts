"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type NotificationType =
  | "booking_request"
  | "booking_accepted"
  | "booking_rejected"
  | "new_message"
  | "new_review"
  | "ride_alert";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  rideId?: string;
  bookingId?: string;
}

/**
 * Create a notification for a user.
 *
 * SECURITY: This uses the service role client to bypass RLS,
 * but first verifies the caller is authenticated.
 * All notification creation must go through this server action.
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  rideId,
  bookingId,
}: CreateNotificationParams) {
  // Verify the caller is authenticated
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: authentication required");
  }

  // ── Cooldown: prevent duplicate notifications within window ──
  const sr = createServiceRoleClient();
  const cooldownMinutes = type === "new_message" ? 5 : type === "ride_alert" ? 60 : 15;
  const cooldownWindow = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();

  const { data: recent, error: recentError } = await sr
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("ride_id", rideId || "")
    .gte("created_at", cooldownWindow)
    .maybeSingle();

  if (recentError) {
    console.error("[notification-actions] cooldown check error:", recentError.message);
  }
  if (recent) {
    // Duplicate notification within cooldown window — skip
    return false;
  }

  // Use service role to insert notification for the target user
  const { error } = await sr.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    ride_id: rideId || null,
    booking_id: bookingId || null,
    read: false,
  });

  if (error) {
    console.error("[notification-actions] insert error:", error.message);
    return false;
  }

  return true;
}

export async function notifyBookingRequest(
  driverId: string,
  passengerName: string,
  rideId: string,
  bookingId: string
) {
  return createNotification({
    userId: driverId,
    type: "booking_request",
    title: "Nuova richiesta di passaggio",
    body: `${passengerName} ha richiesto di unirsi al tuo passaggio`,
    rideId,
    bookingId,
  });
}

export async function notifyBookingAccepted(
  passengerId: string,
  driverName: string,
  rideId: string,
  bookingId: string
) {
  return createNotification({
    userId: passengerId,
    type: "booking_accepted",
    title: "Passaggio confermato!",
    body: `${driverName} ha accettato la tua richiesta`,
    rideId,
    bookingId,
  });
}

export async function notifyBookingRejected(
  passengerId: string,
  driverName: string,
  rideId: string,
  bookingId: string
) {
  return createNotification({
    userId: passengerId,
    type: "booking_rejected",
    title: "Richiesta non accettata",
    body: `${driverName} non può offrirti il passaggio`,
    rideId,
    bookingId,
  });
}

export async function notifyNewMessage(
  userId: string,
  senderName: string,
  rideId: string,
  bookingId: string
) {
  return createNotification({
    userId,
    type: "new_message",
    title: "Nuovo messaggio",
    body: `Hai ricevuto un messaggio da ${senderName}`,
    rideId,
    bookingId,
  });
}

export async function notifyNewReview(
  reviewedId: string,
  reviewerName: string,
  rideId: string
) {
  return createNotification({
    userId: reviewedId,
    type: "new_review",
    title: "Hai ricevuto una recensione",
    body: `${reviewerName} ha lasciato una recensione sul tuo passaggio`,
    rideId,
  });
}

export async function notifyRideAlert(
  userId: string,
  fromCity: string,
  toCity: string,
  rideId: string
) {
  return createNotification({
    userId,
    type: "ride_alert",
    title: "Nuovo passaggio disponibile!",
    body: `Trovato un passaggio da ${fromCity} a ${toCity}`,
    rideId,
  });
}
