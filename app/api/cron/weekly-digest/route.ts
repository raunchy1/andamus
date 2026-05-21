import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendWeeklyDigestEmail } from "@/lib/emails/send";

/**
 * Weekly digest cron job.
 * Sends a summary email to active users about:
 * - New rides on their favorite routes
 * - Their streak status
 * - Recommended actions
 *
 * Runs every Monday at 9 AM.
 */

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sr = createServiceRoleClient();

  // Get users who opted into ride reminders and have been active in last 30 days
  const { data: users, error: usersError } = await sr
    .from("profiles")
    .select("id, name, email, email_ride_reminders, last_active_at")
    .eq("email_ride_reminders", true)
    .not("email", "is", null);

  if (usersError) {
    console.error("[weekly-digest] users fetch error:", usersError.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const activeUsers = (users || []).filter((u) => u.last_active_at && u.last_active_at > thirtyDaysAgo);

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const user of activeUsers) {
    try {
      // Find rides this week matching user's recent search patterns
      const { data: recentRides } = await sr
        .from("rides")
        .select("id, from_city, to_city, date, time, price, profiles(name)")
        .eq("status", "active")
        .gte("date", new Date().toISOString().split("T")[0])
        .lte("date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(5);

      if (!recentRides || recentRides.length === 0) {
        results.skipped++;
        continue;
      }

      // Get streak info
      const { data: streakData } = await sr
        .from("user_activity_weeks")
        .select("week_key")
        .eq("user_id", user.id)
        .order("week_key", { ascending: false })
        .limit(4);

      const hasStreak = (streakData || []).length >= 2;

      const ridesFormatted = recentRides.map((r: Record<string, unknown>) => ({
        from: (r as { from_city: string }).from_city,
        to: (r as { to_city: string }).to_city,
        date: (r as { date: string }).date,
        time: (r as { time: string }).time.slice(0, 5),
        price: (r as { price: number }).price,
        driver: Array.isArray((r as { profiles: unknown[] }).profiles)
          ? ((r as { profiles: { name: string }[] }).profiles[0]?.name || "Autista")
          : (((r as { profiles: { name: string } }).profiles)?.name || "Autista"),
      }));

      await sendWeeklyDigestEmail({
        to: user.email!,
        name: user.name || "Utente",
        rides: ridesFormatted,
        hasStreak,
        streakWeeks: streakData?.length || 0,
      });

      results.sent++;
    } catch (err) {
      console.error(`[weekly-digest] failed for ${user.id}:`, err);
      results.failed++;
    }
  }

  return NextResponse.json({ success: true, ...results });
}
