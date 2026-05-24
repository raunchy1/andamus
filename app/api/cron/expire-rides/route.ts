import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAppNow } from "@/lib/date-utils";
import { apiError, apiSuccess } from "@/lib/server/api-utils";
import { checkRateLimit, rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { env } from "@/lib/server/validators/env";

/**
 * Cron job that automatically expires rides whose departure time has passed.
 * Runs daily at midnight via Vercel Cron (see vercel.json).
 */
export async function GET(request: NextRequest) {
  // ── Cron secret validation (fail closed) ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = env().CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  // ── Rate limit ──
  const rl = await checkRateLimit({
    identifier: "cron:expire-rides",
    ...rateLimitPresets.cron,
  });
  if (!rl.success) {
    return apiError("Rate limit exceeded", "RATE_LIMITED", 429);
  }

  try {
    const supabase = createServiceRoleClient();
    const { date: todayISO, time: currentTime } = getAppNow();

    // Expire rides from past days
    const { data, error } = await supabase
      .from("rides")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("date", todayISO)
      .select("id")
      .returns<{ id: string }[]>();

    if (error) {
      console.error("[expire-rides] Supabase error:", error);
      return apiError("Database error", "DB_ERROR", 500, [error.message]);
    }

    // Expire same-day rides whose time has passed
    const { data: sameDayData, error: sameDayError } = await supabase
      .from("rides")
      .update({ status: "expired" })
      .eq("status", "active")
      .eq("date", todayISO)
      .lt("time", currentTime)
      .select("id")
      .returns<{ id: string }[]>();

    if (sameDayError) {
      console.error("[expire-rides] same-day error:", sameDayError);
      return apiError("Database error", "DB_ERROR", 500, [sameDayError.message]);
    }

    const expiredCount = (data?.length || 0) + (sameDayData?.length || 0);

    const response = apiSuccess({
      expired: expiredCount,
      pastDays: data?.length || 0,
      pastToday: sameDayData?.length || 0,
    });
    response.headers.set("X-RateLimit-Limit", String(rl.limit));
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return response;
  } catch (err) {
    console.error("[expire-rides] unexpected error:", err);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
