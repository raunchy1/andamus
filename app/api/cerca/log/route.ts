import { NextRequest, NextResponse } from "next/server";
import { logSearchQuery } from "@/lib/server/liquidity/tracker";
import { withRateLimit } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";

async function handler(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { from_city, to_city, date, results_count, device_type } = body;

    if (!from_city || !to_city) {
      return NextResponse.json({ error: "Missing required route fields" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "127.0.0.1";

    await logSearchQuery({
      from_city,
      to_city,
      date,
      results_count: results_count || 0,
      device_type: device_type || "unknown",
      ip_address: ip,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("[api/cerca/log] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, { rateLimit: rateLimitPresets.standard });