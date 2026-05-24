"use server";

/**
 * Cache Warmers
 * =============
 * Pre-populate critical cache entries to prevent cold-start latency.
 * Run after deploys, data imports, or on a schedule via cron.
 *
 * WHY: Cold cache hits cause user-facing latency spikes.
 * Warming ensures popular data is always available instantly.
 */

import { getRedis } from "@/lib/redis";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { CacheKeys, CacheTags, CacheTTL } from "./keys";
import { cacheSet } from "./cache";

// ---------------------------------------------------------------------------
// Warm individual domains
// ---------------------------------------------------------------------------

/**
 * Warm the today's rides cache.
 */
export async function warmTodayRides(limit = 10): Promise<number> {
  const supabase = await createServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("rides")
    .select(`
      id, driver_id, from_city, to_city, date, time, seats, price, status,
      profiles!inner(name, avatar_url, rating, review_count)
    `)
    .eq("status", "active")
    .eq("date", today)
    .order("time", { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error("[warmers] warmTodayRides error:", error?.message);
    return 0;
  }

  await cacheSet(CacheKeys.todayRides(limit), data, {
    ttlSeconds: CacheTTL.todayRides,
    tags: [CacheTags.allRides()],
  });

  return data.length;
}

/**
 * Warm popular routes for homepage/search suggestions.
 */
export async function warmPopularRoutes(): Promise<number> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("mv_popular_routes")
    .select("from_city, to_city, ride_count, avg_price")
    .limit(50);

  if (error || !data) {
    console.error("[warmers] warmPopularRoutes error:", error?.message);
    return 0;
  }

  await cacheSet(CacheKeys.popularRoutes(), data, {
    ttlSeconds: CacheTTL.popularRoutes,
    tags: [CacheTags.allRides(), CacheTags.allAnalytics()],
  });

  return data.length;
}

/**
 * Warm trending routes (most active in last 7 days).
 */
export async function warmTrendingRoutes(): Promise<number> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("rides")
    .select("from_city, to_city, created_at, price")
    .eq("status", "active")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
    .limit(200);

  if (error || !data) {
    console.error("[warmers] warmTrendingRoutes error:", error?.message);
    return 0;
  }

  // Aggregate in memory
  const routeCounts = new Map<string, { from: string; to: string; count: number; totalPrice: number }>();
  for (const ride of data as Array<{ from_city: string; to_city: string; price: number }>) {
    const key = `${ride.from_city}|${ride.to_city}`;
    const existing = routeCounts.get(key);
    if (existing) {
      existing.count++;
      existing.totalPrice += ride.price;
    } else {
      routeCounts.set(key, { from: ride.from_city, to: ride.to_city, count: 1, totalPrice: ride.price });
    }
  }

  const trending = Array.from(routeCounts.values())
    .map((r) => ({ from_city: r.from, to_city: r.to, count: r.count, avg_price: r.totalPrice / r.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  await cacheSet(CacheKeys.trendingRoutes(), trending, {
    ttlSeconds: CacheTTL.trendingRoutes,
    tags: [CacheTags.allRides()],
  });

  return trending.length;
}

/**
 * Warm driver leaderboard for premium/analytics.
 */
export async function warmDriverLeaderboard(): Promise<number> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("mv_driver_leaderboard")
    .select("*")
    .limit(100);

  if (error || !data) {
    console.error("[warmers] warmDriverLeaderboard error:", error?.message);
    return 0;
  }

  await cacheSet(CacheKeys.driverLeaderboard(), data, {
    ttlSeconds: CacheTTL.driverLeaderboard,
    tags: [CacheTags.allAnalytics()],
  });

  return data.length;
}

/**
 * Warm upcoming events listing.
 */
export async function warmUpcomingEvents(): Promise<number> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "active")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(20);

  if (error || !data) {
    console.error("[warmers] warmUpcomingEvents error:", error?.message);
    return 0;
  }

  await cacheSet(CacheKeys.upcomingEvents(), data, {
    ttlSeconds: CacheTTL.upcomingEvents,
    tags: [CacheTags.allEvents()],
  });

  return data.length;
}

/**
 * Warm daily metrics for today and yesterday.
 */
export async function warmDailyMetrics(): Promise<number> {
  const supabase = await createServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_metrics")
    .select("*")
    .in("date", [today, yesterday])
    .order("date", { ascending: false });

  if (error || !data) {
    console.error("[warmers] warmDailyMetrics error:", error?.message);
    return 0;
  }

  let warmed = 0;
  for (const metric of data as Array<{ date: string }>) {
    await cacheSet(CacheKeys.dailyMetrics(metric.date), metric, {
      ttlSeconds: CacheTTL.dailyMetrics,
      tags: [CacheTags.allAnalytics()],
    });
    warmed++;
  }

  return warmed;
}

/**
 * Warm search suggestions (top cities from rides).
 */
export async function warmSearchSuggestions(): Promise<number> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("rides")
    .select("from_city, to_city")
    .eq("status", "active")
    .gte("date", new Date().toISOString().split("T")[0])
    .limit(1000);

  if (error || !data) {
    console.error("[warmers] warmSearchSuggestions error:", error?.message);
    return 0;
  }

  const cities = new Set<string>();
  for (const ride of data as Array<{ from_city: string; to_city: string }>) {
    cities.add(ride.from_city);
    cities.add(ride.to_city);
  }

  const suggestions = Array.from(cities).sort();

  await cacheSet(CacheKeys.searchSuggestions("all"), suggestions, {
    ttlSeconds: CacheTTL.searchSuggestions,
    tags: [CacheTags.searchIndex()],
  });

  return suggestions.length;
}

// ---------------------------------------------------------------------------
// Orchestrated warm-all
// ---------------------------------------------------------------------------

export interface WarmResult {
  domain: string;
  warmed: number;
  durationMs: number;
  error?: string;
}

/**
 * Run all warmers sequentially. Returns detailed results.
 * Call this from a cron job or post-deploy hook.
 */
export async function warmAllCache(): Promise<{
  results: WarmResult[];
  totalWarmed: number;
  totalDurationMs: number;
}> {
  const tasks: Array<{ name: string; fn: () => Promise<number> }> = [
    { name: "today_rides", fn: () => warmTodayRides(10) },
    { name: "popular_routes", fn: warmPopularRoutes },
    { name: "trending_routes", fn: warmTrendingRoutes },
    { name: "driver_leaderboard", fn: warmDriverLeaderboard },
    { name: "upcoming_events", fn: warmUpcomingEvents },
    { name: "daily_metrics", fn: warmDailyMetrics },
    { name: "search_suggestions", fn: warmSearchSuggestions },
  ];

  const results: WarmResult[] = [];
  let totalWarmed = 0;
  const overallStart = Date.now();

  for (const task of tasks) {
    const start = Date.now();
    try {
      const count = await task.fn();
      const duration = Date.now() - start;
      results.push({ domain: task.name, warmed: count, durationMs: duration });
      totalWarmed += count;
    } catch (err) {
      const duration = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      results.push({ domain: task.name, warmed: 0, durationMs: duration, error: message });
    }
  }

  return {
    results,
    totalWarmed,
    totalDurationMs: Date.now() - overallStart,
  };
}

/**
 * Check if cache needs warming (Redis is empty for critical keys).
 */
export async function shouldWarmCache(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const keys = await redis.keys("ride:today:*");
    return !keys || keys.length === 0;
  } catch {
    return false;
  }
}
