import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/server/guards";
import { getAllQueueStats, getQueueHealth, recoverStuckJobs } from "@/lib/server/queue/monitoring";
import { getAllCircuitStatuses } from "@/lib/server/resilience/circuit-breaker";

/**
 * GET /api/admin/queue
 * Returns queue statistics and health for all background queues.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
  }

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
}
