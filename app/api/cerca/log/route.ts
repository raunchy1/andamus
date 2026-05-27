import { NextRequest, NextResponse } from "next/server";
import { logSearchQuery } from "@/lib/server/liquidity/tracker";

/**
 * API route to log search query telemetry in a typesafe, non-blocking way.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from_city, to_city, date, results_count, device_type } = body;

    if (!from_city || !to_city) {
      return NextResponse.json({ error: "Missing required route fields" }, { status: 400 });
    }

    // Capture client IP from request headers for security/telemetry
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "127.0.0.1";

    // Non-blocking background log
    // Next.js will continue executing after the response is sent if using waitUntil, 
    // but in normal routes we can just await it quickly as it has low overhead.
    await logSearchQuery({
      from_city,
      to_city,
      date,
      results_count: results_count || 0,
      device_type: device_type || "unknown",
      ip_address: ip,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[api/cerca/log] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
