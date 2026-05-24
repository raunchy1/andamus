import { NextRequest } from "next/server";
import { getDailyMetrics, getRideConversionFunnel } from "@/lib/server/analytics/pipeline";
import { withAdmin, apiSuccess } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";
import type { AuthContext } from "@/lib/server/guards/auth";

async function handler(req: NextRequest, _ctx: AuthContext) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || undefined;

  const [metrics, funnel] = await Promise.all([
    getDailyMetrics(date),
    getRideConversionFunnel(30),
  ]);

  return apiSuccess({ metrics, funnel });
}

export const GET = withAdmin(handler, { rateLimit: rateLimitPresets.generous });
