import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/server/api-utils";
import { getAllQueueStats, getQueueHealth, recoverStuckJobs } from "@/lib/server/queue/monitoring";
import { getAllCircuitStatuses } from "@/lib/server/resilience/circuit-breaker";

/**
 * GET /api/admin/queue
 * Returns queue statistics and health for all background queues.
 */
export async function GET(request: NextRequest) {
  return withAdmin(async () => {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "recover") {
      const result = await recoverStuckJobs();
      return NextResponse.json(result);
    }

    const [stats, health, circuits] = await Promise.all([
      getAllQueueStats(),
      getQueueHealth(),
      getAllCircuitStatuses(),
    ]);

    return NextResponse.json({
      queues: stats,
      health,
      circuitBreakers: circuits,
    });
  });
}
