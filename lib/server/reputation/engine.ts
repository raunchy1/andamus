"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";

export interface ReputationMetrics {
  userId: string;
  trustScore: number;
  completionRate: number;
  cancellationRate: number;
  responseRate: number;
  avgRating: number;
  reviewCount: number;
  ridesPublished: number;
  ridesCompleted: number;
  bookingsMade: number;
  bookingsConfirmed: number;
  streakWeeks: number;
  verifiedFlags: {
    phone: boolean;
    email: boolean;
    id: boolean;
    driver: boolean;
  };
  fraudRisk: "low" | "medium" | "high";
  lastCalculated: string;
}

/**
 * Calculate comprehensive reputation metrics for a user.
 * Uses service role for reliable cross-table aggregation.
 */
export async function calculateReputation(userId: string): Promise<ReputationMetrics> {
  const cacheKey = `reputation:${userId}`;
  const redis = getRedis();

  if (redis) {
    try {
      const cached = await redis.get<ReputationMetrics>(cacheKey);
      if (cached && Date.now() - new Date(cached.lastCalculated).getTime() < 3600000) {
        return cached;
      }
    } catch {
      // Cache miss
    }
  }

  const sr = createServiceRoleClient();

  // Parallel queries for all metrics
  const [
    profileRes,
    ridesPublishedRes,
    ridesCompletedRes,
    bookingsMadeRes,
    bookingsConfirmedRes,
    reviewsReceivedRes,
    reviewsGivenRes,
    cancellationsRes,
    activityRes,
    reportsRes,
  ] = await Promise.all([
    sr.from("profiles").select("rating, review_count, rides_count, completed_rides_count, phone_verified, email_verified, id_verified, driver_verified, created_at").eq("id", userId).single(),
    sr.from("rides").select("id", { count: "exact", head: true }).eq("driver_id", userId),
    sr.from("rides").select("id", { count: "exact", head: true }).eq("driver_id", userId).eq("status", "completed"),
    sr.from("bookings").select("id", { count: "exact", head: true }).eq("passenger_id", userId),
    sr.from("bookings").select("id", { count: "exact", head: true }).eq("passenger_id", userId).eq("status", "confirmed"),
    sr.from("reviews").select("rating").eq("reviewed_id", userId),
    sr.from("reviews").select("id", { count: "exact", head: true }).eq("reviewer_id", userId),
    sr.from("booking_cancellations").select("id", { count: "exact", head: true }).eq("canceled_by", userId),
    sr.from("user_activity_weeks").select("week_key").eq("user_id", userId).order("week_key", { ascending: false }),
    sr.from("safety_reports").select("id", { count: "exact", head: true }).eq("reported_id", userId),
  ]);

  const profile = profileRes.data;
  const ridesPublished = ridesPublishedRes.count || 0;
  const ridesCompleted = ridesCompletedRes.count || 0;
  const bookingsMade = bookingsMadeRes.count || 0;
  const bookingsConfirmed = bookingsConfirmedRes.count || 0;
  const reviewsReceived = reviewsReceivedRes.data || [];
  const _reviewsGiven = reviewsGivenRes.count || 0;
  const cancellations = cancellationsRes.count || 0;
  const activityWeeks = activityRes.data || [];
  const reportsCount = reportsRes.count || 0;

  // Calculate metrics
  const avgRating = reviewsReceived.length > 0
    ? reviewsReceived.reduce((sum, r) => sum + ((r as Record<string, unknown>).rating as number), 0) / reviewsReceived.length
    : 5.0;

  const totalBookings = bookingsMade + ridesPublished;
  const successfulInteractions = bookingsConfirmed + ridesCompleted;
  const completionRate = totalBookings > 0 ? successfulInteractions / totalBookings : 1;
  const cancellationRate = totalBookings > 0 ? cancellations / totalBookings : 0;

  // Response rate (driver accepting/rejecting bookings within 24h)
  const { data: pendingBookings } = await sr
    .from("bookings")
    .select("created_at, status")
    .eq("ride_id", userId)
    .not("status", "eq", "pending")
    .limit(50);

  const respondedBookings = (pendingBookings || []).filter((b) => {
    const created = new Date((b as Record<string, unknown>).created_at as string).getTime();
    return Date.now() - created < 24 * 60 * 60 * 1000;
  });
  const responseRate = pendingBookings && pendingBookings.length > 0
    ? respondedBookings.length / pendingBookings.length
    : 1;

  // Streak calculation
  let streakWeeks = 0;
  if (activityWeeks.length > 0) {
    const weeks = activityWeeks.map((w) => (w as Record<string, unknown>).week_key as string);
    const weekSet = new Set(weeks);
    const nowWeek = getWeekKey(new Date());
    const lastWeek = getWeekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    if (weekSet.has(nowWeek) || weekSet.has(lastWeek)) {
      streakWeeks = 1;
      let checkWeek = weekSet.has(nowWeek) ? nowWeek : lastWeek;
      while (true) {
        const prev = new Date(new Date(checkWeek).getTime() - 7 * 24 * 60 * 60 * 1000);
        const prevKey = prev.toISOString().split("T")[0];
        if (weekSet.has(prevKey)) {
          streakWeeks++;
          checkWeek = prevKey;
        } else break;
      }
    }
  }

  // Fraud risk assessment
  let fraudRisk: "low" | "medium" | "high" = "low";
  if (reportsCount >= 3 || cancellationRate > 0.5 || (reviewsReceived.length >= 3 && avgRating < 2)) {
    fraudRisk = "high";
  } else if (reportsCount >= 1 || cancellationRate > 0.3 || (reviewsReceived.length >= 3 && avgRating < 3)) {
    fraudRisk = "medium";
  }

  // Trust score (0-100)
  let trustScore = 0;

  // Base: account age (max 15)
  if (profile?.created_at) {
    const days = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
    trustScore += Math.min(15, days / 7);
  }

  // Reviews (max 25)
  trustScore += Math.min(20, reviewsReceived.length * 4);
  trustScore += Math.min(5, (avgRating - 3) * 2.5);

  // Activity (max 25)
  trustScore += Math.min(15, ridesPublished * 3);
  trustScore += Math.min(10, ridesCompleted * 2);

  // Verifications (max 20)
  if (profile?.email_verified) trustScore += 5;
  if (profile?.phone_verified) trustScore += 5;
  if (profile?.id_verified) trustScore += 5;
  if (profile?.driver_verified) trustScore += 5;

  // Reliability bonuses (max 15)
  if (completionRate >= 0.9) trustScore += 5;
  if (responseRate >= 0.8) trustScore += 5;
  if (streakWeeks >= 2) trustScore += 5;

  // Penalties
  if (cancellationRate > 0.3) trustScore -= 10;
  if (reportsCount > 0) trustScore -= reportsCount * 5;
  if (fraudRisk === "high") trustScore -= 20;

  trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

  const metrics: ReputationMetrics = {
    userId,
    trustScore,
    completionRate: Math.round(completionRate * 100) / 100,
    cancellationRate: Math.round(cancellationRate * 100) / 100,
    responseRate: Math.round(responseRate * 100) / 100,
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount: reviewsReceived.length,
    ridesPublished,
    ridesCompleted,
    bookingsMade,
    bookingsConfirmed,
    streakWeeks,
    verifiedFlags: {
      phone: !!profile?.phone_verified,
      email: !!profile?.email_verified,
      id: !!profile?.id_verified,
      driver: !!profile?.driver_verified,
    },
    fraudRisk,
    lastCalculated: new Date().toISOString(),
  };

  if (redis) {
    try {
      await redis.setex(cacheKey, 3600, metrics);
    } catch {
      // Cache write failure is non-blocking
    }
  }

  return metrics;
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Batch recalculate reputation for all active users.
 * Intended for cron job execution.
 */
export async function batchRecalculateReputation(batchSize = 100): Promise<{
  processed: number;
  errors: number;
}> {
  const sr = createServiceRoleClient();
  const { data: users, error } = await sr
    .from("profiles")
    .select("id")
    .limit(batchSize);

  if (error || !users) {
    return { processed: 0, errors: 1 };
  }

  let processed = 0;
  let errors = 0;

  await Promise.all(
    users.map(async (u) => {
      try {
        await calculateReputation((u as Record<string, unknown>).id as string);
        processed++;
      } catch {
        errors++;
      }
    })
  );

  return { processed, errors };
}
