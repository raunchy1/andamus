import { NextRequest, NextResponse } from "next/server";
import { runCommuterRemindersEngine } from "@/lib/server/growth/reminders";
import { checkRateLimit, rateLimitPresets } from "@/lib/rate-limit";

/**
 * SECURE CRON TASK: Runs commuter reminders every hour (but filtered by quiet hours and 24h user cooldowns).
 * Triggered by scheduler with Authorization Bearer CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Secure verification
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit checks to prevent cron double trigger spam
    const rateLimit = await checkRateLimit({
      identifier: "cron:commuter-reminders",
      limit: 10,
      window: "1h", // 10 times per hour max
    });

    if (!rateLimit.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const result = await runCommuterRemindersEngine();

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: any) {
    console.error("[api/cron/commuter-reminders] Cron execution failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
