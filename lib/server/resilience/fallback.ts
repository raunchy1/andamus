import "server-only";

/**
 * Fallback Strategies
 * ===================
 * Graceful degradation when primary services fail.
 * WHY: Users should still be able to browse rides and use core features
 * even if AI recommendations, real-time updates, or analytics are unavailable.
 */

import { getRedis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import { logWarn } from "@/lib/server/observability/logging";

// ---------------------------------------------------------------------------
// Fallback data stores
// ---------------------------------------------------------------------------

/**
 * Static fallback data for when dynamic content is unavailable.
 * These are conservative defaults that preserve UX.
 */
export const FallbackData = {
  rides: {
    empty: [] as Array<Record<string, unknown>>,
    today: [] as Array<Record<string, unknown>>,
  },
  search: {
    results: [] as Array<Record<string, unknown>>,
    suggestions: ["Roma", "Milano", "Napoli", "Torino", "Bologna", "Firenze", "Venezia"] as string[],
  },
  user: {
    profile: null as Record<string, unknown> | null,
    entitlements: {
      canBoost: false,
      canAccessAnalytics: false,
      hasPriorityVisibility: false,
      monthlyRideLimit: 5,
      commissionRate: 0,
      planId: null,
    },
  },
  notifications: {
    items: [] as Array<Record<string, unknown>>,
    unreadCount: 0,
  },
  recommendations: {
    rides: [] as Array<Record<string, unknown>>,
    users: [] as Array<Record<string, unknown>>,
  },
  analytics: {
    summary: {
      dau: 0,
      newUsers: 0,
      newRides: 0,
      newBookings: 0,
      revenue: 0,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Service fallbacks
// ---------------------------------------------------------------------------

/**
 * Fallback for ride searches when Supabase is slow/unavailable.
 * Returns cached results if available, otherwise empty list.
 */
export async function fallbackRideSearch(): Promise<Array<Record<string, unknown>>> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get("fallback:ride_search");
      if (cached) {
        return JSON.parse(cached as string) as Array<Record<string, unknown>>;
      }
    } catch {
      // Ignore cache errors
    }
  }

  logWarn("Ride search fallback: returning empty results");
  return FallbackData.search.results;
}

/**
 * Fallback for today's rides.
 * Tries to return yesterday's cached rides as a best-effort.
 */
export async function fallbackTodayRides(): Promise<Array<Record<string, unknown>>> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get("fallback:today_rides");
      if (cached) {
        return JSON.parse(cached as string) as Array<Record<string, unknown>>;
      }
    } catch {
      // Ignore
    }
  }

  logWarn("Today's rides fallback: returning empty results");
  return FallbackData.rides.today;
}

/**
 * Fallback for user profile when auth/profile service fails.
 * Returns a minimal anonymous profile.
 */
export function fallbackUserProfile(): Record<string, unknown> {
  return {
    id: "anonymous",
    name: "Ospite",
    avatar_url: null,
    rating: 5,
    rides_count: 0,
    review_count: 0,
    is_fallback: true,
  };
}

/**
 * Fallback for user entitlements when subscription check fails.
 * Defaults to free tier (most restrictive).
 */
export function fallbackEntitlements(): typeof FallbackData.user.entitlements {
  return { ...FallbackData.user.entitlements };
}

/**
 * Fallback for AI recommendations when the recommendation service fails.
 * Returns trending/popular rides from cache.
 */
export async function fallbackRecommendations(): Promise<Array<Record<string, unknown>>> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get("fallback:recommendations");
      if (cached) {
        return JSON.parse(cached as string) as Array<Record<string, unknown>>;
      }
    } catch {
      // Ignore
    }
  }

  logWarn("Recommendations fallback: returning empty results");
  return FallbackData.recommendations.rides;
}

/**
 * Fallback for notifications when the notification service fails.
 */
export function fallbackNotifications(): typeof FallbackData.notifications {
  return { ...FallbackData.notifications };
}

/**
 * Fallback for analytics dashboard when analytics service fails.
 */
export function fallbackAnalytics(): typeof FallbackData.analytics.summary {
  return { ...FallbackData.analytics.summary };
}

// ---------------------------------------------------------------------------
// Cache warming for fallbacks
// ---------------------------------------------------------------------------

/**
 * Pre-populate fallback caches with current data.
 * Call this periodically so fallbacks are never truly empty.
 */
export async function warmFallbackCaches(): Promise<{
  warmed: number;
  errors: number;
}> {
  const redis = getRedis();
  if (!redis) return { warmed: 0, errors: 0 };

  let warmed = 0;
  let errors = 0;

  // Warm ride search fallback
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("rides")
      .select("id, from_city, to_city, date, time, price, seats, status, profiles!inner(name, avatar_url, rating)")
      .eq("status", "active")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(50);

    if (data) {
      await redis.setex("fallback:ride_search", 3600, JSON.stringify(data));
      warmed++;
    }
  } catch {
    errors++;
  }

  // Warm today's rides fallback
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("rides")
      .select("id, from_city, to_city, date, time, price, seats, status, profiles!inner(name, avatar_url, rating)")
      .eq("status", "active")
      .eq("date", today)
      .order("time", { ascending: true })
      .limit(20);

    if (data) {
      await redis.setex("fallback:today_rides", 1800, JSON.stringify(data));
      warmed++;
    }
  } catch {
    errors++;
  }

  // Warm recommendations fallback (popular routes)
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mv_popular_routes")
      .select("from_city, to_city, ride_count, avg_price")
      .limit(20);

    if (data) {
      await redis.setex("fallback:recommendations", 3600, JSON.stringify(data));
      warmed++;
    }
  } catch {
    errors++;
  }

  return { warmed, errors };
}

// ---------------------------------------------------------------------------
// Health check helpers
// ---------------------------------------------------------------------------

export interface ServiceHealth {
  service: string;
  healthy: boolean;
  latencyMs: number;
  lastCheckedAt: string;
}

/**
 * Quick health check for critical services.
 */
export async function checkServiceHealth(): Promise<ServiceHealth[]> {
  const results: ServiceHealth[] = [];

  // Check Supabase
  const supabaseStart = Date.now();
  try {
    const supabase = await createClient();
    await supabase.from("rides").select("count", { count: "exact", head: true });
    results.push({
      service: "supabase",
      healthy: true,
      latencyMs: Date.now() - supabaseStart,
      lastCheckedAt: new Date().toISOString(),
    });
  } catch {
    results.push({
      service: "supabase",
      healthy: false,
      latencyMs: Date.now() - supabaseStart,
      lastCheckedAt: new Date().toISOString(),
    });
  }

  // Check Redis
  const redisStart = Date.now();
  const redis = getRedis();
  try {
    if (redis) {
      await redis.ping();
      results.push({
        service: "redis",
        healthy: true,
        latencyMs: Date.now() - redisStart,
        lastCheckedAt: new Date().toISOString(),
      });
    } else {
      results.push({
        service: "redis",
        healthy: false,
        latencyMs: Date.now() - redisStart,
        lastCheckedAt: new Date().toISOString(),
      });
    }
  } catch {
    results.push({
      service: "redis",
      healthy: false,
      latencyMs: Date.now() - redisStart,
      lastCheckedAt: new Date().toISOString(),
    });
  }

  return results;
}
