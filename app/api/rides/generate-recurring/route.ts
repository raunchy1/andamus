import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { apiError, apiSuccess } from "@/lib/server/api-utils";
import { checkRateLimit, rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { env } from "@/lib/server/validators/env";

export async function POST(req: NextRequest) {
  // ── Cron secret validation (fail closed) ──
  const authHeader = req.headers.get("authorization");
  const cronSecret = env().CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  // ── Rate limit by cron signature ──
  const rl = await checkRateLimit({
    identifier: "cron:generate-recurring",
    ...rateLimitPresets.cron,
  });
  if (!rl.success) {
    return apiError("Rate limit exceeded", "RATE_LIMITED", 429);
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("generate_rides_from_templates", {
      p_days_ahead: 30,
    });

    if (error) {
      console.error("[rides/generate-recurring] RPC error:", error);
      throw error;
    }

    const response = apiSuccess({ generated: data });
    response.headers.set("X-RateLimit-Limit", String(rl.limit));
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[rides/generate-recurring] Error:", message);
    return apiError(message, "GENERATION_FAILED", 500);
  }
}

// Also support GET for manual triggering
export async function GET(req: NextRequest) {
  return POST(req);
}
