"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAppNow } from "@/lib/date-utils";
import { batchRecalculateReputation } from "@/lib/server/reputation/engine";
import { enqueueJob, type JobPayload } from "./queue";

/**
 * Process a background job based on its type.
 * This is the main job processor entry point.
 */
export async function processJob(job: JobPayload): Promise<void> {
  switch (job.type) {
    case "stale_ride_cleanup":
      await handleStaleRideCleanup();
      break;
    case "reputation_recalculation":
      await handleReputationRecalculation(job.data);
      break;
    case "notification_digest":
      await handleNotificationDigest(job.data);
      break;
    case "recommendation_generation":
      await handleRecommendationGeneration(job.data);
      break;
    case "analytics_aggregation":
      await handleAnalyticsAggregation(job.data);
      break;
    case "ride_reminder":
      await handleRideReminder(job.data);
      break;
    default:
      console.warn(`[jobs] Unknown job type: ${job.type}`);
  }
}

/**
 * Clean up stale rides (expired, cancelled, or never confirmed).
 */
async function handleStaleRideCleanup(): Promise<void> {
  const sr = createServiceRoleClient();
  const { date: today } = getAppNow();

  // Mark expired rides as completed
  const { error } = await sr
    .from("rides")
    .update({ status: "completed" })
    .eq("status", "active")
    .lt("date", today);

  if (error) {
    throw new Error(`Stale ride cleanup failed: ${error.message}`);
  }

  // Auto-cancel pending bookings for expired rides
  const { error: bookingError } = await sr
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "pending")
    .or('status.eq.completed');

  if (bookingError) {
    throw new Error(`Booking cleanup failed: ${bookingError.message}`);
  }
}

/**
 * Recalculate reputation for users in batches.
 */
async function handleReputationRecalculation(data: Record<string, unknown>): Promise<void> {
  const batchSize = (data.batchSize as number) || 100;
  const result = await batchRecalculateReputation(batchSize);
  console.log(`[jobs] Reputation recalculation: ${result.processed} processed, ${result.errors} errors`);
}

/**
 * Send daily/weekly notification digests.
 */
async function handleNotificationDigest(data: Record<string, unknown>): Promise<void> {
  const userId = data.userId as string;
  if (!userId) return;

  const { processQueuedNotifications } = await import("@/lib/server/notifications/service");
  const sent = await processQueuedNotifications(userId);
  console.log(`[jobs] Notification digest for ${userId}: ${sent} sent`);
}

/**
 * Generate personalized ride recommendations.
 */
async function handleRecommendationGeneration(data: Record<string, unknown>): Promise<void> {
  const userId = data.userId as string;
  if (!userId) return;

  const { getRecommendedRides } = await import("@/lib/server/ai/matching");
  const recommendations = await getRecommendedRides(userId, 5);
  console.log(`[jobs] Generated ${recommendations.length} recommendations for ${userId}`);
}

/**
 * Aggregate analytics data.
 */
async function handleAnalyticsAggregation(data: Record<string, unknown>): Promise<void> {
  const period = (data.period as string) || "daily";
  const sr = createServiceRoleClient();

  const today = new Date().toISOString().split("T")[0];

  // Daily active users
  const { count: dau } = await sr
    .from("user_actions")
    .select("user_id", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59`);

  // New rides today
  const { count: newRides } = await sr
    .from("rides")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`);

  // New bookings today
  const { count: newBookings } = await sr
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00`);

  // Insert aggregated metrics
  await sr.from("daily_metrics").upsert(
    {
      date: today,
      period,
      dau: dau || 0,
      new_rides: newRides || 0,
      new_bookings: newBookings || 0,
    },
    { onConflict: "date,period" }
  );

  console.log(`[jobs] Analytics aggregation for ${today}: DAU=${dau}, rides=${newRides}, bookings=${newBookings}`);
}

/**
 * Send ride reminder notifications.
 */
async function handleRideReminder(data: Record<string, unknown>): Promise<void> {
  const rideId = data.rideId as string;
  if (!rideId) return;

  const sr = createServiceRoleClient();

  // Get ride details
  const { data: ride } = await sr
    .from("rides")
    .select("from_city, to_city, date, time, driver_id")
    .eq("id", rideId)
    .single();

  if (!ride) return;

  // Get confirmed passengers
  const { data: bookings } = await sr
    .from("bookings")
    .select("passenger_id")
    .eq("ride_id", rideId)
    .eq("status", "confirmed");

  const { sendNotification } = await import("@/lib/server/notifications/service");

  const rideData = ride as Record<string, unknown>;
  const title = "Promemoria di viaggio";
  const body = `Il tuo passaggio da ${rideData.from_city} a ${rideData.to_city} è domani alle ${String(rideData.time).slice(0, 5)}`;

  // Notify passengers
  for (const booking of bookings || []) {
    const passengerId = (booking as Record<string, unknown>).passenger_id as string;
    await sendNotification({
      userId: passengerId,
      type: "ride_reminder",
      title,
      body,
      rideId,
      url: `/corsa/${rideId}`,
      priority: "normal",
    });
  }

  // Notify driver
  await sendNotification({
    userId: rideData.driver_id as string,
    type: "ride_reminder",
    title: "Promemoria di viaggio",
    body: `Hai un passaggio programmato domani da ${rideData.from_city} a ${rideData.to_city}`,
    rideId,
    url: `/profilo`,
    priority: "normal",
  });
}

/**
 * Schedule recurring jobs.
 */
export async function scheduleRecurringJobs(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Daily stale ride cleanup at 3 AM
  await enqueueJob("stale_ride_cleanup", {}, { delayMs: tomorrow.getTime() - Date.now() + 3 * 60 * 60 * 1000, idempotencyKey: `cleanup:${tomorrow.toISOString().split("T")[0]}` });

  // Daily reputation recalculation at 4 AM
  await enqueueJob("reputation_recalculation", { batchSize: 100 }, { delayMs: tomorrow.getTime() - Date.now() + 4 * 60 * 60 * 1000, idempotencyKey: `reputation:${tomorrow.toISOString().split("T")[0]}` });

  // Daily analytics at 5 AM
  await enqueueJob("analytics_aggregation", { period: "daily" }, { delayMs: tomorrow.getTime() - Date.now() + 5 * 60 * 60 * 1000, idempotencyKey: `analytics:${tomorrow.toISOString().split("T")[0]}` });
}
