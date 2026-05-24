"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";

export interface AnalyticsEvent {
  userId?: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

export interface FunnelMetrics {
  step: string;
  users: number;
  conversionRate: number;
}

export interface RetentionMetrics {
  cohortDate: string;
  day0: number;
  day1: number;
  day7: number;
  day30: number;
}

/**
 * Track an analytics event server-side.
 * Batches events in Redis for efficiency.
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  const redis = getRedis();
  const payload = { ...event, timestamp: event.timestamp || new Date().toISOString() };

  if (redis) {
    try {
      await redis.lpush("analytics:events", JSON.stringify(payload));
      await redis.ltrim("analytics:events", 0, 9999); // Keep last 10k events
    } catch {
      // Fallback to direct DB insert
    }
  }

  // Also insert into analytics_events table for persistence
  const sr = createServiceRoleClient();
  await sr.from("analytics_events").insert({
    user_id: event.userId || null,
    event: event.event,
    properties: event.properties || {},
    created_at: payload.timestamp,
  });
}

/**
 * Get ride conversion funnel metrics.
 */
export async function getRideConversionFunnel(days = 30): Promise<FunnelMetrics[]> {
  const sr = createServiceRoleClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const [
    searchRes,
    viewRes,
    requestRes,
    confirmRes,
    completeRes,
  ] = await Promise.all([
    sr.from("user_actions").select("user_id", { count: "exact", head: true }).eq("action", "search").gte("created_at", sinceStr),
    sr.from("user_actions").select("user_id", { count: "exact", head: true }).eq("action", "ride_view").gte("created_at", sinceStr),
    sr.from("bookings").select("passenger_id", { count: "exact", head: true }).gte("created_at", sinceStr),
    sr.from("bookings").select("passenger_id", { count: "exact", head: true }).eq("status", "confirmed").gte("created_at", sinceStr),
    sr.from("rides").select("driver_id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", sinceStr),
  ]);

  const searchCount = searchRes.count || 1;
  const viewCount = viewRes.count || 0;
  const requestCount = requestRes.count || 0;
  const confirmCount = confirmRes.count || 0;
  const completeCount = completeRes.count || 0;

  return [
    { step: "search", users: searchCount, conversionRate: 100 },
    { step: "view", users: viewCount, conversionRate: Math.round((viewCount / searchCount) * 1000) / 10 },
    { step: "request", users: requestCount, conversionRate: Math.round((requestCount / searchCount) * 1000) / 10 },
    { step: "confirm", users: confirmCount, conversionRate: Math.round((confirmCount / searchCount) * 1000) / 10 },
    { step: "complete", users: completeCount, conversionRate: Math.round((completeCount / searchCount) * 1000) / 10 },
  ];
}

/**
 * Get user retention cohorts.
 */
export async function getRetentionCohorts(): Promise<RetentionMetrics[]> {
  const sr = createServiceRoleClient();

  const { data: signups } = await sr
    .from("profiles")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!signups) return [];

  const cohorts = new Map<string, Set<string>>();

  for (const s of signups) {
    const date = new Date((s as Record<string, unknown>).created_at as string).toISOString().split("T")[0];
    if (!cohorts.has(date)) cohorts.set(date, new Set());
  }

  // Get active users per day
  const { data: actions } = await sr
    .from("user_actions")
    .select("user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  const activeByDay = new Map<string, Set<string>>();
  for (const a of actions || []) {
    const day = new Date((a as Record<string, unknown>).created_at as string).toISOString().split("T")[0];
    const userId = (a as Record<string, unknown>).user_id as string;
    if (!activeByDay.has(day)) activeByDay.set(day, new Set());
    activeByDay.get(day)!.add(userId);
  }

  const results: RetentionMetrics[] = [];
  for (const [date, users] of cohorts.entries()) {
    const cohortUsers = Array.from(users);
    const day0 = cohortUsers.length;

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const day1Users = activeByDay.get(nextDay.toISOString().split("T")[0]) || new Set();

    const day7Date = new Date(date);
    day7Date.setDate(day7Date.getDate() + 7);
    const day7Users = activeByDay.get(day7Date.toISOString().split("T")[0]) || new Set();

    const day30Date = new Date(date);
    day30Date.setDate(day30Date.getDate() + 30);
    const day30Users = activeByDay.get(day30Date.toISOString().split("T")[0]) || new Set();

    results.push({
      cohortDate: date,
      day0,
      day1: cohortUsers.filter((u) => day1Users.has(u)).length,
      day7: cohortUsers.filter((u) => day7Users.has(u)).length,
      day30: cohortUsers.filter((u) => day30Users.has(u)).length,
    });
  }

  return results.slice(0, 30);
}

/**
 * Get daily metrics summary.
 */
export async function getDailyMetrics(date?: string): Promise<{
  dau: number;
  newUsers: number;
  newRides: number;
  newBookings: number;
  conversionRate: number;
  avgRidePrice: number;
}> {
  const targetDate = date || new Date().toISOString().split("T")[0];
  const sr = createServiceRoleClient();

  const [
    dauRes,
    newUsersRes,
    newRidesRes,
    newBookingsRes,
    pricesRes,
  ] = await Promise.all([
    sr.from("user_actions").select("user_id", { count: "exact", head: true }).gte("created_at", `${targetDate}T00:00:00`).lt("created_at", `${targetDate}T23:59:59`),
    sr.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", `${targetDate}T00:00:00`).lt("created_at", `${targetDate}T23:59:59`),
    sr.from("rides").select("id", { count: "exact", head: true }).gte("created_at", `${targetDate}T00:00:00`).lt("created_at", `${targetDate}T23:59:59`),
    sr.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", `${targetDate}T00:00:00`).lt("created_at", `${targetDate}T23:59:59`),
    sr.from("rides").select("price").gte("created_at", `${targetDate}T00:00:00`).lt("created_at", `${targetDate}T23:59:59`).eq("status", "active"),
  ]);

  const dau = dauRes.count || 0;
  const newUsers = newUsersRes.count || 0;
  const newRides = newRidesRes.count || 0;
  const newBookings = newBookingsRes.count || 0;
  const prices = (pricesRes.data || []) as { price: number }[];
  const avgPrice = prices.length > 0 ? prices.reduce((s, p) => s + p.price, 0) / prices.length : 0;

  return {
    dau,
    newUsers,
    newRides,
    newBookings,
    conversionRate: dau > 0 ? Math.round((newBookings / dau) * 1000) / 10 : 0,
    avgRidePrice: Math.round(avgPrice * 100) / 100,
  };
}
