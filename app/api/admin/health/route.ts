import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/server/api-utils";
import { getCacheHealth } from "@/lib/server/cache";
import { getViewHealth } from "@/lib/server/db/materialized-views";
import { checkServiceHealth } from "@/lib/server/resilience/fallback";
import { getQueueHealth } from "@/lib/server/queue/monitoring";

/**
 * GET /api/admin/health
 * Comprehensive system health check for admin monitoring.
 */
export async function GET(request: NextRequest) {
  return withAdmin(async () => {
    const searchParams = request.nextUrl.searchParams;
    const detailed = searchParams.get("detailed") === "true";

    const [cacheHealth, viewHealth, serviceHealth, queueHealth] = await Promise.all([
      getCacheHealth(),
      getViewHealth(),
      checkServiceHealth(),
      getQueueHealth(),
    ]);

    const overallHealthy =
      serviceHealth.every((s) => s.healthy) &&
      queueHealth.healthy &&
      cacheHealth.redisConnected;

    const response: Record<string, unknown> = {
      status: overallHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: serviceHealth,
      cache: {
        redisConnected: cacheHealth.redisConnected,
        memoryEntries: cacheHealth.memoryEntries,
        hitRate: Math.round(cacheHealth.hitRate * 100) / 100,
      },
      queues: queueHealth,
    };

    if (detailed) {
      response.materializedViews = viewHealth;
      response.circuitBreakers = "use /api/admin/queue for circuit breaker status";
    }

    return NextResponse.json(response, {
      status: overallHealthy ? 200 : 503,
    });
  });
}
