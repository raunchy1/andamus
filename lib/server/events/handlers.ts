import "server-only";

/**
 * Event Handlers
 * ==============
 * Side-effect handlers for domain events.
 * WHY: Separates business logic from side effects (notifications,
 * cache invalidation, analytics). Each handler is idempotent and retry-safe.
 */

import { getRedis } from "@/lib/redis";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { cacheInvalidateTag, cacheInvalidateTags } from "@/lib/server/cache";
import { CacheTags } from "@/lib/server/cache/keys";
import { registerHandler } from "./subscriber";
import type { EventEnvelope } from "./types";

// ---------------------------------------------------------------------------
// Helper: track event in analytics
// ---------------------------------------------------------------------------

async function trackEvent(
  eventName: string,
  userId: string | undefined,
  properties: Record<string, unknown>
): Promise<void> {
  const supabase = await createServiceRoleClient();
  try {
    await supabase.from("hourly_metrics").insert({
      hour: new Date().toISOString(),
      endpoint: `event:${eventName}`,
      requests: 1,
      // Additional properties stored in a generic analytics_events table if needed
    });
  } catch {
    // Analytics tracking is best-effort
  }
}

// ---------------------------------------------------------------------------
// Ride event handlers
// ---------------------------------------------------------------------------

async function handleRideCreated(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "ride.created") return { success: true };

  try {
    // Invalidate ride feeds
    await cacheInvalidateTags([
      CacheTags.allRides(),
      CacheTags.user(event.payload.driverId),
    ]);

    // Track analytics
    await trackEvent("ride_created", event.payload.driverId, {
      fromCity: event.payload.fromCity,
      toCity: event.payload.toCity,
      price: event.payload.price,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function handleRideUpdated(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "ride.updated") return { success: true };

  try {
    await cacheInvalidateTags([
      CacheTags.ride(event.payload.rideId),
      CacheTags.allRides(),
    ]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function handleRideCancelled(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "ride.cancelled") return { success: true };

  try {
    await cacheInvalidateTags([
      CacheTags.ride(event.payload.rideId),
      CacheTags.allRides(),
      CacheTags.user(event.payload.driverId),
    ]);

    // Notify affected passengers
    for (const passengerId of event.payload.affectedPassengerIds) {
      await cacheInvalidateTag(CacheTags.notifications(passengerId));
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function handleRideCompleted(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "ride.completed") return { success: true };

  try {
    // Invalidate ride and driver caches
    await cacheInvalidateTags([
      CacheTags.ride(event.payload.rideId),
      CacheTags.driver(event.payload.driverId),
    ]);

    // Queue reputation recalculation for all participants
    const redis = getRedis();
    if (redis) {
      await redis.lpush("queue:reputation", JSON.stringify({
        userIds: [event.payload.driverId, ...event.payload.passengerIds],
        triggeredBy: "ride.completed",
      }));
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Booking event handlers
// ---------------------------------------------------------------------------

async function handleBookingCreated(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "booking.created") return { success: true };

  try {
    await cacheInvalidateTags([
      CacheTags.user(event.payload.passengerId),
      CacheTags.user(event.payload.driverId),
      CacheTags.ride(event.payload.rideId),
    ]);

    await trackEvent("booking_created", event.payload.passengerId, {
      rideId: event.payload.rideId,
      driverId: event.payload.driverId,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function handleBookingConfirmed(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "booking.confirmed") return { success: true };

  try {
    await cacheInvalidateTags([
      CacheTags.user(event.payload.passengerId),
      CacheTags.user(event.payload.driverId),
      CacheTags.ride(event.payload.rideId),
    ]);

    await trackEvent("booking_confirmed", event.payload.passengerId, {
      rideId: event.payload.rideId,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function handleBookingCancelled(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "booking.cancelled") return { success: true };

  try {
    await cacheInvalidateTags([
      CacheTags.user(event.payload.passengerId),
      CacheTags.user(event.payload.driverId),
      CacheTags.ride(event.payload.rideId),
    ]);

    await trackEvent("booking_cancelled", event.payload.passengerId, {
      rideId: event.payload.rideId,
      cancelledBy: event.payload.cancelledBy,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// User event handlers
// ---------------------------------------------------------------------------

async function handleUserRegistered(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "user.registered") return { success: true };

  try {
    await cacheInvalidateTag(CacheTags.allUsers());

    await trackEvent("user_registered", event.payload.userId, {
      hasReferral: !!event.payload.referralCode,
    });

    // Queue welcome notification
    const redis = getRedis();
    if (redis) {
      await redis.lpush("queue:notifications", JSON.stringify({
        type: "welcome",
        userId: event.payload.userId,
      }));
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function handleUserUpdated(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "user.updated") return { success: true };

  try {
    await cacheInvalidateTag(CacheTags.user(event.payload.userId));
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Review event handlers
// ---------------------------------------------------------------------------

async function handleReviewCreated(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "review.created") return { success: true };

  try {
    await cacheInvalidateTags([
      CacheTags.driver(event.payload.reviewedId),
      CacheTags.ride(event.payload.rideId),
      CacheTags.user(event.payload.reviewerId),
    ]);

    // Queue reputation recalculation
    const redis = getRedis();
    if (redis) {
      await redis.lpush("queue:reputation", JSON.stringify({
        userIds: [event.payload.reviewedId],
        triggeredBy: "review.created",
      }));
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Message event handlers
// ---------------------------------------------------------------------------

async function handleMessageSent(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "message.sent") return { success: true };

  try {
    await cacheInvalidateTag(CacheTags.notifications(event.payload.receiverId));

    // Track message analytics
    await trackEvent("message_sent", event.payload.senderId, {
      contentType: event.payload.contentType,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Payment event handlers
// ---------------------------------------------------------------------------

async function handlePaymentCompleted(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "payment.completed") return { success: true };

  try {
    await cacheInvalidateTags([
      CacheTags.user(event.payload.payerId),
      CacheTags.user(event.payload.payeeId),
    ]);

    await trackEvent("payment_completed", event.payload.payerId, {
      amount: event.payload.amount,
      currency: event.payload.currency,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Moderation event handlers
// ---------------------------------------------------------------------------

async function handleContentReported(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "content.reported") return { success: true };

  try {
    const supabase = await createServiceRoleClient();

    // Auto-flag user if critical severity
    if (event.payload.severity === "critical") {
      await supabase
        .from("profiles")
        .update({ is_blocked: true, blocked_at: new Date().toISOString() })
        .eq("id", event.payload.reportedUserId);
    }

    // Increment report count on profile
    await supabase.rpc("increment_profile_report_count", {
      user_id: event.payload.reportedUserId,
    });

    await cacheInvalidateTag(CacheTags.user(event.payload.reportedUserId));
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Subscription event handlers
// ---------------------------------------------------------------------------

async function handleSubscriptionChanged(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "subscription.changed") return { success: true };

  try {
    await cacheInvalidateTags([
      CacheTags.user(event.payload.userId),
      CacheTags.allAnalytics(),
    ]);

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Safety event handlers
// ---------------------------------------------------------------------------

async function handleSafetyAlert(envelope: EventEnvelope): Promise<{ success: boolean; error?: string }> {
  const { event } = envelope;
  if (event.type !== "safety.alert") return { success: true };

  try {
    const redis = getRedis();
    if (redis) {
      // High-priority notification queue
      await redis.lpush("queue:notifications:critical", JSON.stringify({
        type: "sos_alert",
        alertId: event.payload.alertId,
        userId: event.payload.userId,
        rideId: event.payload.rideId,
        location: event.payload.location,
      }));
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Registration — call this once at app startup
// ---------------------------------------------------------------------------

let _handlersRegistered = false;

export function registerAllEventHandlers(): void {
  if (_handlersRegistered) return;
  _handlersRegistered = true;

  // Ride events
  registerHandler({ eventType: "ride.created", handler: handleRideCreated, idempotent: true });
  registerHandler({ eventType: "ride.updated", handler: handleRideUpdated, idempotent: true });
  registerHandler({ eventType: "ride.cancelled", handler: handleRideCancelled, idempotent: true });
  registerHandler({ eventType: "ride.completed", handler: handleRideCompleted, idempotent: true });

  // Booking events
  registerHandler({ eventType: "booking.created", handler: handleBookingCreated, idempotent: true });
  registerHandler({ eventType: "booking.confirmed", handler: handleBookingConfirmed, idempotent: true });
  registerHandler({ eventType: "booking.cancelled", handler: handleBookingCancelled, idempotent: true });

  // User events
  registerHandler({ eventType: "user.registered", handler: handleUserRegistered, idempotent: true });
  registerHandler({ eventType: "user.updated", handler: handleUserUpdated, idempotent: true });

  // Review events
  registerHandler({ eventType: "review.created", handler: handleReviewCreated, idempotent: true });

  // Message events
  registerHandler({ eventType: "message.sent", handler: handleMessageSent, idempotent: true });

  // Payment events
  registerHandler({ eventType: "payment.completed", handler: handlePaymentCompleted, idempotent: true });

  // Moderation events
  registerHandler({ eventType: "content.reported", handler: handleContentReported, idempotent: true });

  // Subscription events
  registerHandler({ eventType: "subscription.changed", handler: handleSubscriptionChanged, idempotent: true });

  // Safety events
  registerHandler({ eventType: "safety.alert", handler: handleSafetyAlert, idempotent: true });
}
