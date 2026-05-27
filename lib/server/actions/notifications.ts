"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureVapidDetails, webPush } from "@/lib/web-push";

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
 * Maps notification types to user preference columns.
 */
function getPreferenceColumn(type: NotificationType): string | null {
  switch (type) {
    case "booking_request":
      return "push_booking_requests";
    case "booking_accepted":
    case "booking_rejected":
      return "push_booking_confirmed";
    case "new_message":
      return "push_new_messages";
    case "ride_alert":
      return "push_ride_alerts";
    default:
      return null;
  }
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

  const sr = createServiceRoleClient();

  // ── Opt-out check: verify user preferences in public.profiles ──
  const prefColumn = getPreferenceColumn(type);
  if (prefColumn) {
    const { data: profile } = await sr
      .from("profiles")
      .select(prefColumn)
      .eq("id", userId)
      .maybeSingle();

    if (profile && (profile as unknown as Record<string, unknown>)[prefColumn] === false) {
      console.log(`[notifications] User ${userId} has opted out of ${type} notifications. Skipping.`);
      return false;
    }
  }

  // ── Cooldown: prevent duplicate notifications within window ──
  const cooldownMinutes = type === "new_message" ? 5 : type === "ride_alert" ? 180 : 15;
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
    console.log(`[notifications] Cooldown active for user ${userId} / ${type}. Skipped duplicate.`);
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
  const result = await createNotification({
    userId: driverId,
    type: "booking_request",
    title: "Nuova richiesta di passaggio",
    body: `${passengerName} ha richiesto di unirsi al tuo passaggio`,
    rideId,
    bookingId,
  });
  // Non-blocking push
  sendPushToUser({
    userId: driverId,
    title: "Nuova richiesta di passaggio",
    body: `${passengerName} ha richiesto di unirsi al tuo passaggio`,
    url: `/chat/${bookingId}`,
    type: "booking_request",
  }).catch(() => {});
  return result;
}

export async function notifyBookingAccepted(
  passengerId: string,
  driverName: string,
  rideId: string,
  bookingId: string
) {
  const result = await createNotification({
    userId: passengerId,
    type: "booking_accepted",
    title: "Passaggio confermato! 🎉",
    body: `${driverName} ha accettato la tua richiesta`,
    rideId,
    bookingId,
  });
  sendPushToUser({
    userId: passengerId,
    title: "Passaggio confermato! 🎉",
    body: `${driverName} ha accettato la tua richiesta`,
    url: `/chat/${bookingId}`,
    type: "booking_accepted",
  }).catch(() => {});
  return result;
}

export async function notifyBookingRejected(
  passengerId: string,
  driverName: string,
  rideId: string,
  bookingId: string
) {
  const result = await createNotification({
    userId: passengerId,
    type: "booking_rejected",
    title: "Richiesta non accettata",
    body: `${driverName} non può offrirti il passaggio`,
    rideId,
    bookingId,
  });
  sendPushToUser({
    userId: passengerId,
    title: "Richiesta non accettata",
    body: `${driverName} non può offrirti il passaggio`,
    url: `/profilo`,
    type: "booking_rejected",
  }).catch(() => {});
  return result;
}

export async function notifyNewMessage(
  userId: string,
  senderName: string,
  rideId: string,
  bookingId: string
) {
  const result = await createNotification({
    userId,
    type: "new_message",
    title: "Nuovo messaggio",
    body: `Hai ricevuto un messaggio da ${senderName}`,
    rideId,
    bookingId,
  });
  sendPushToUser({
    userId,
    title: "Nuovo messaggio",
    body: `Da ${senderName}`,
    url: `/chat/${bookingId}`,
    type: "new_message",
  }).catch(() => {});
  return result;
}

export async function notifyNewReview(
  reviewedId: string,
  reviewerName: string,
  rideId: string
) {
  const result = await createNotification({
    userId: reviewedId,
    type: "new_review",
    title: "Hai ricevuto una recensione",
    body: `${reviewerName} ha lasciato una recensione sul tuo passaggio`,
    rideId,
  });
  sendPushToUser({
    userId: reviewedId,
    title: "Nuova recensione",
    body: `${reviewerName} ha lasciato una recensione`,
    url: `/corsa/${rideId}`,
    type: "new_review",
  }).catch(() => {});
  return result;
}

export async function notifyRideAlert(
  userId: string,
  fromCity: string,
  toCity: string,
  rideId: string
) {
  const result = await createNotification({
    userId,
    type: "ride_alert",
    title: "Nuovo passaggio disponibile!",
    body: `Trovato un passaggio da ${fromCity} a ${toCity}`,
    rideId,
  });
  sendPushToUser({
    userId,
    title: "Nuovo passaggio disponibile!",
    body: `${fromCity} → ${toCity}`,
    url: `/corsa/${rideId}?ref=alert`,
    type: "ride_alert",
  }).catch(() => {});
  return result;
}

/**
 * Dispatches scarcity warnings to drivers or saved route searchers when a ride is nearly full (1 seat left).
 */
export async function notifyScarcityAlert(
  userId: string,
  fromCity: string,
  toCity: string,
  rideId: string
) {
  const title = "Ultimo posto rimasto! ⚡";
  const body = `Affrettati, c'è solo un posto rimasto per il viaggio ${fromCity} → ${toCity}!`;
  
  const result = await createNotification({
    userId,
    type: "ride_alert",
    title,
    body,
    rideId,
  });

  sendPushToUser({
    userId,
    title,
    body,
    url: `/corsa/${rideId}?ref=scarcity`,
    type: "ride_alert",
  }).catch(() => {});

  return result;
}

/**
 * Send a push notification to all devices subscribed by a user.
 * Non-blocking: failures are logged but not thrown.
 */
export async function sendPushToUser({
  userId,
  title,
  body,
  url,
  type,
}: {
  userId: string;
  title: string;
  body: string;
  url: string;
  type?: NotificationType;
}) {
  const sr = createServiceRoleClient();

  // ── Opt-out check: verify user push preferences before network requests ──
  if (type) {
    const prefColumn = getPreferenceColumn(type);
    if (prefColumn) {
      const { data: profile } = await sr
        .from("profiles")
        .select(prefColumn)
        .eq("id", userId)
        .maybeSingle();

      if (profile && (profile as unknown as Record<string, unknown>)[prefColumn] === false) {
        return; // skip push
      }
    }
  }

  // ── Quiet hours check: 22:00 - 07:00 Europe/Rome (Sardinian timezone) ──
  try {
    const romeTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" });
    const romeHour = new Date(romeTime).getHours();
    if (romeHour >= 22 || romeHour < 7) {
      console.log("[notifications] Quiet hours active. Push skipped.");
      return;
    }
  } catch (err) {
    console.error("[notifications] Timezone check failed:", err);
  }

  try {
    ensureVapidDetails();
  } catch {
    // VAPID not configured — skip push silently
    return;
  }

  const { data: subscriptions } = await sr
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    url,
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — clean up
          await sr.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    })
  );
}
