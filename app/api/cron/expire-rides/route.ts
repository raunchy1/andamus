import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cron job that automatically expires rides whose departure time has passed.
 *
 * Runs every 15 minutes via Vercel Cron.
 * Updates rides.status from 'active' → 'expired' when date + time < now().
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (fail closed)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Update all active rides whose date is strictly in the past
    const { data, error } = await supabase
      .from("rides")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("date", new Date().toISOString().split("T")[0])
      .select("id")
      .returns<{ id: string }[]>();

    if (error) {
      console.error("[expire-rides] Supabase error:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    // Also expire same-day rides whose time has passed (Europe/Rome)
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Europe/Rome",
    });
    const currentTime = new Date().toLocaleTimeString("sv-SE", {
      timeZone: "Europe/Rome",
      hour12: false,
    });

    const { data: sameDayData, error: sameDayError } = await supabase
      .from("rides")
      .update({ status: "expired" })
      .eq("status", "active")
      .eq("date", today)
      .lt("time", currentTime)
      .select("id")
      .returns<{ id: string }[]>();

    if (sameDayError) {
      console.error("[expire-rides] same-day error:", sameDayError);
      return NextResponse.json(
        { error: "Database error", details: sameDayError.message },
        { status: 500 }
      );
    }

    const expiredCount = (data?.length || 0) + (sameDayData?.length || 0);

    return NextResponse.json({
      success: true,
      expired: expiredCount,
      pastDays: data?.length || 0,
      pastToday: sameDayData?.length || 0,
    });
  } catch (err) {
    console.error("[expire-rides] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
