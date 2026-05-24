"use server";

/**
 * Materialized View Management
 * ============================
 * Scheduled refresh of analytics materialized views.
 * WHY: Dashboard queries on raw tables become O(N) slow at scale.
 * Materialized views pre-compute aggregations for O(1) reads.
 * CONCURRENTLY refreshes avoid locking reads.
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";

// ---------------------------------------------------------------------------
// View registry
// ---------------------------------------------------------------------------

export type MaterializedViewName =
  | "mv_popular_routes"
  | "mv_driver_leaderboard"
  | "mv_daily_ride_stats"
  | "mv_daily_booking_stats";

interface ViewConfig {
  name: MaterializedViewName;
  refreshIntervalMinutes: number;
  lastRefreshKey: string;
}

const VIEW_REGISTRY: ViewConfig[] = [
  { name: "mv_popular_routes", refreshIntervalMinutes: 15, lastRefreshKey: "mv:popular_routes:last_refresh" },
  { name: "mv_driver_leaderboard", refreshIntervalMinutes: 30, lastRefreshKey: "mv:driver_leaderboard:last_refresh" },
  { name: "mv_daily_ride_stats", refreshIntervalMinutes: 60, lastRefreshKey: "mv:daily_ride_stats:last_refresh" },
  { name: "mv_daily_booking_stats", refreshIntervalMinutes: 60, lastRefreshKey: "mv:daily_booking_stats:last_refresh" },
];

// ---------------------------------------------------------------------------
// Refresh logic
// ---------------------------------------------------------------------------

/**
 * Refresh a single materialized view concurrently (non-blocking reads).
 */
export async function refreshMaterializedView(
  viewName: MaterializedViewName
): Promise<{ success: boolean; durationMs: number; error?: string }> {
  const start = Date.now();
  const supabase = await createServiceRoleClient();

  try {
    // Supabase supports REFRESH MATERIALIZED VIEW via raw RPC or direct SQL
    const { error } = await supabase.rpc("refresh_materialized_view", {
      view_name: viewName,
    });

    if (error) {
      // Fallback: direct SQL via postgres extension
      const { error: sqlError } = await supabase.rpc("exec_sql", {
        sql: `REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`,
      });

      if (sqlError) {
        // Final fallback: use the service role client with raw
        // This requires the pg_execute function or similar
        throw new Error(sqlError.message);
      }
    }

    const duration = Date.now() - start;

    // Update last refresh timestamp in Redis
    const redis = getRedis();
    if (redis) {
      const config = VIEW_REGISTRY.find((v) => v.name === viewName);
      if (config) {
        await redis.set(config.lastRefreshKey, Date.now().toString());
      }
    }

    return { success: true, durationMs: duration };
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[materialized-views] Refresh ${viewName} failed:`, message);
    return { success: false, durationMs: duration, error: message };
  }
}

/**
 * Refresh all registered views that are due based on their interval.
 * Call this from a cron job or background worker.
 */
export async function refreshStaleViews(): Promise<
  Array<{ view: MaterializedViewName; refreshed: boolean; durationMs: number; error?: string }>
> {
  const redis = getRedis();
  const results: Array<{ view: MaterializedViewName; refreshed: boolean; durationMs: number; error?: string }> = [];

  for (const config of VIEW_REGISTRY) {
    let shouldRefresh = true;

    if (redis) {
      const lastRefresh = await redis.get(config.lastRefreshKey);
      if (lastRefresh) {
        const elapsed = Date.now() - Number(lastRefresh);
        shouldRefresh = elapsed > config.refreshIntervalMinutes * 60 * 1000;
      }
    }

    if (shouldRefresh) {
      const result = await refreshMaterializedView(config.name);
      results.push({
        view: config.name,
        refreshed: result.success,
        durationMs: result.durationMs,
        error: result.error,
      });
    } else {
      results.push({
        view: config.name,
        refreshed: false,
        durationMs: 0,
      });
    }
  }

  return results;
}

/**
 * Force refresh all views regardless of interval.
 * Use sparingly (e.g. after bulk data imports).
 */
export async function refreshAllViews(): Promise<
  Array<{ view: MaterializedViewName; success: boolean; durationMs: number; error?: string }>
> {
  const results: Array<{ view: MaterializedViewName; success: boolean; durationMs: number; error?: string }> = [];

  for (const config of VIEW_REGISTRY) {
    const result = await refreshMaterializedView(config.name);
    results.push({
      view: config.name,
      success: result.success,
      durationMs: result.durationMs,
      error: result.error,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// View metadata
// ---------------------------------------------------------------------------

export interface ViewHealth {
  view: MaterializedViewName;
  lastRefreshAt: number | null;
  refreshIntervalMinutes: number;
  isStale: boolean;
  staleForMinutes: number;
}

/**
 * Get health status of all materialized views.
 */
export async function getViewHealth(): Promise<ViewHealth[]> {
  const redis = getRedis();
  const now = Date.now();

  return Promise.all(
    VIEW_REGISTRY.map(async (config) => {
      let lastRefreshAt: number | null = null;

      if (redis) {
        const val = await redis.get(config.lastRefreshKey);
        if (val) lastRefreshAt = Number(val);
      }

      const staleFor = lastRefreshAt
        ? (now - lastRefreshAt) / 60000
        : Infinity;

      return {
        view: config.name,
        lastRefreshAt,
        refreshIntervalMinutes: config.refreshIntervalMinutes,
        isStale: staleFor > config.refreshIntervalMinutes,
        staleForMinutes: Math.round(staleFor),
      };
    })
  );
}
