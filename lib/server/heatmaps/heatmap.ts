"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";
import { captureEvent } from "@/lib/posthog";

export type RouteHeatmapResult = {
  from_city: string;
  to_city: string;
  demand_score: number; // 0 - 100
  total_searches: number;
  zero_results_count: number;
  scarcity_indicator: "high" | "medium" | "low";
  last_updated: string;
};

/**
 * Calculates a dynamic demand intensity score (0-100) based on search logs metrics.
 * Volume factor weights search frequency, Empty ratio weights zero-result frustration.
 */
function calculateDemandScore(total: number, zeroCount: number): number {
  if (total === 0) return 0;
  // Volume Factor scales up to 50 searches in a 7-day window (value: 0.0 - 1.0)
  const volumeFactor = Math.min(1.0, total / 50);
  const emptyRatio = zeroCount / total;

  // Demand intensity is weighted 60% search volume and 40% empty search ratio
  const rawScore = (volumeFactor * 60) + (emptyRatio * 40);
  return Math.min(100, Math.round(rawScore));
}

/**
 * Resolves the qualitative scarcity level from a demand score
 */
function resolveScarcityIndicator(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 35) return "medium";
  return "low";
}

/**
 * Fetches or calculates demand intensity for a specific route.
 * Employs Upstash Redis caching for low latency, falling back to dynamic DB queries.
 */
export async function getRouteHeatmap(
  fromCity: string,
  toCity: string
): Promise<RouteHeatmapResult> {
  const cleanFrom = fromCity?.trim();
  const cleanTo = toCity?.trim();

  if (!cleanFrom || !cleanTo) {
    return {
      from_city: cleanFrom,
      to_city: cleanTo,
      demand_score: 0,
      total_searches: 0,
      zero_results_count: 0,
      scarcity_indicator: "low",
      last_updated: new Date().toISOString(),
    };
  }

  const redis = getRedis();
  const cacheKey = `heatmap:route:${cleanFrom.toLowerCase()}:${cleanTo.toLowerCase()}`;

  // Try Redis cache read first
  if (redis) {
    try {
      const cached = await redis.get<RouteHeatmapResult>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.warn("[heatmap] Redis read error:", err);
    }
  }

  // Cache miss or Redis unavailable: dynamic Postgres aggregation
  const supabase = createServiceRoleClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: logs, error } = await supabase
    .from("search_logs")
    .select("results_count")
    .eq("from_city", cleanFrom)
    .eq("to_city", cleanTo)
    .gte("created_at", sevenDaysAgo.toISOString())
    .limit(1000);

  if (error) {
    console.error("[heatmap] Fetch search logs error:", error.message);
    return {
      from_city: cleanFrom,
      to_city: cleanTo,
      demand_score: 0,
      total_searches: 0,
      zero_results_count: 0,
      scarcity_indicator: "low",
      last_updated: new Date().toISOString(),
    };
  }

  const total = logs?.length || 0;
  const zeroCount = logs?.filter(log => log.results_count === 0).length || 0;
  const score = calculateDemandScore(total, zeroCount);
  const indicator = resolveScarcityIndicator(score);

  const result: RouteHeatmapResult = {
    from_city: cleanFrom,
    to_city: cleanTo,
    demand_score: score,
    total_searches: total,
    zero_results_count: zeroCount,
    scarcity_indicator: indicator,
    last_updated: new Date().toISOString(),
  };

  // Cache in Redis for 1 hour
  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: 3600 });
    } catch (err) {
      console.warn("[heatmap] Redis write error:", err);
    }
  }

  // Telemetry track
  captureEvent("heatmap_calculated", {
    from_city: cleanFrom,
    to_city: cleanTo,
    demand_score: score,
    total_searches: total,
    zero_results_count: zeroCount,
  });

  return result;
}

/**
 * Aggregates all search telemetry to find top 10 hottest routes in Sardinia.
 */
export async function getHotSpots(): Promise<RouteHeatmapResult[]> {
  const redis = getRedis();
  const cacheKey = "heatmap:hotspots";

  if (redis) {
    try {
      const cached = await redis.get<RouteHeatmapResult[]>(cacheKey);
      if (cached) return cached;
    } catch (err) {
      console.warn("[heatmap] Redis hotspots read error:", err);
    }
  }

  const supabase = createServiceRoleClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch recent searches to aggregate
  const { data: logs, error } = await supabase
    .from("search_logs")
    .select("from_city, to_city, results_count")
    .gte("created_at", sevenDaysAgo.toISOString())
    .limit(5000);

  if (error || !logs) {
    console.error("[heatmap] Fetch hotspots error:", error?.message);
    return [];
  }

  // Manual route groupings
  const routesMap: Record<string, { from_city: string; to_city: string; total: number; zero: number }> = {};
  
  logs.forEach(log => {
    const key = `${log.from_city.trim()}->${log.to_city.trim()}`;
    if (!routesMap[key]) {
      routesMap[key] = {
        from_city: log.from_city.trim(),
        to_city: log.to_city.trim(),
        total: 0,
        zero: 0,
      };
    }
    routesMap[key].total++;
    if (log.results_count === 0) {
      routesMap[key].zero++;
    }
  });

  const spots: RouteHeatmapResult[] = Object.values(routesMap)
    .map(route => {
      const score = calculateDemandScore(route.total, route.zero);
      return {
        from_city: route.from_city,
        to_city: route.to_city,
        demand_score: score,
        total_searches: route.total,
        zero_results_count: route.zero,
        scarcity_indicator: resolveScarcityIndicator(score),
        last_updated: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.demand_score - a.demand_score)
    .slice(0, 10);

  if (redis && spots.length > 0) {
    try {
      // Cache hotspots for 15 minutes to stay fairly real-time
      await redis.set(cacheKey, spots, { ex: 900 });
    } catch (err) {
      console.warn("[heatmap] Redis hotspots write error:", err);
    }
  }

  return spots;
}
