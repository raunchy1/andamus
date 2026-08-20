import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendWeeklyDigestEmail } from "@/lib/emails/send";
import { apiError, apiSuccess } from "@/lib/server/api-utils";
import { checkRateLimit, rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { env } from "@/lib/server/validators/env";

interface WeeklyRide {
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  driver: string;
}

interface WeeklyDigestUser {
  id: string;
  email: string;
  name: string | null;
  locale: string | null;
}

/** Monday of the week `date` falls in, as YYYY-MM-DD. Mirrors lib/retention.ts. */
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split("T")[0];
}

/** Count back consecutive weeks of recorded activity, ending this week or last. */
function streakFromWeeks(weekKeys: Set<string>): number {
  const thisWeek = getWeekKey(new Date());
  const lastWeek = getWeekKey(new Date(Date.now() - 7 * 86400000));
  let cursor: string;
  if (weekKeys.has(thisWeek)) cursor = thisWeek;
  else if (weekKeys.has(lastWeek)) cursor = lastWeek;
  else return 0;

  let streak = 1;
  for (;;) {
    const prev = getWeekKey(new Date(new Date(cursor).getTime() - 7 * 86400000));
    if (!weekKeys.has(prev)) break;
    streak += 1;
    cursor = prev;
  }
  return streak;
}

export async function GET(request: NextRequest) {
  // ── Cron secret validation (fail closed) ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = env().CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return apiError("Unauthorized", "UNAUTHORIZED", 401);
  }

  // ── Rate limit ──
  const rl = await checkRateLimit({
    identifier: "cron:weekly-digest",
    ...rateLimitPresets.cron,
  });
  if (!rl.success) {
    return apiError("Rate limit exceeded", "RATE_LIMITED", 429);
  }

  try {
    const supabase = createServiceRoleClient();

    // Streaks live in user_activity_weeks (one row per user per active week),
    // so derive them here rather than reading a profiles column.
    const { data: activity, error: activityError } = await supabase
      .from("user_activity_weeks")
      .select("user_id, week_key");

    if (activityError) {
      console.error("[weekly-digest] activity error:", activityError);
      return apiError("Database error", "DB_ERROR", 500);
    }

    const weeksByUser = new Map<string, Set<string>>();
    for (const row of activity ?? []) {
      const userId = String(row.user_id);
      const set = weeksByUser.get(userId) ?? new Set<string>();
      set.add(String(row.week_key));
      weeksByUser.set(userId, set);
    }

    const streakByUser = new Map<string, number>();
    for (const [userId, weeks] of weeksByUser) {
      const streak = streakFromWeeks(weeks);
      if (streak > 0) streakByUser.set(userId, streak);
    }

    if (streakByUser.size === 0) {
      const response = apiSuccess({ message: "No users with streaks", emailsSent: 0 });
      response.headers.set("X-RateLimit-Limit", String(rl.limit));
      response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      return response;
    }

    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, name, locale")
      .in("id", [...streakByUser.keys()])
      .not("email", "is", null)
      .returns<WeeklyDigestUser[]>();

    if (usersError) {
      console.error("[weekly-digest] users error:", usersError);
      return apiError("Database error", "DB_ERROR", 500);
    }

    if (!users || users.length === 0) {
      const response = apiSuccess({ message: "No users with streaks", emailsSent: 0 });
      response.headers.set("X-RateLimit-Limit", String(rl.limit));
      response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      return response;
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Fetch rides for this user in the past week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

        const { data: rideRows, error: ridesError } = await supabase
          .from("rides")
          .select("from_city, to_city, date, time, price, profiles!rides_driver_id_fkey(name)")
          .eq("driver_id", user.id)
          .gte("date", oneWeekAgoStr)
          .eq("status", "completed");

        if (ridesError) {
          errors.push(`User ${user.id}: rides fetch error`);
          continue;
        }

        // The email template wants {from, to, driver}; the table stores
        // from_city/to_city and the driver's name on the joined profile.
        const rides: WeeklyRide[] = (rideRows ?? []).map((r) => {
          const driverProfile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          return {
            from: String(r.from_city ?? ""),
            to: String(r.to_city ?? ""),
            date: String(r.date ?? ""),
            time: String(r.time ?? ""),
            price: Number(r.price ?? 0),
            driver: String((driverProfile as { name?: string } | null)?.name ?? ""),
          };
        });

        const streakWeeks = streakByUser.get(user.id) ?? 0;

        const result = await sendWeeklyDigestEmail({
          to: user.email,
          name: user.name ?? "",
          rides,
          hasStreak: streakWeeks > 0,
          streakWeeks,
        });

        if (result.success) emailsSent++;
        else errors.push(`User ${user.id}: ${result.error}`);
      } catch {
        errors.push(`User ${user.id}: processing error`);
      }
    }

    const response = apiSuccess({
      emailsSent,
      usersProcessed: users.length,
      errors: errors.length > 0 ? errors : undefined,
    });
    response.headers.set("X-RateLimit-Limit", String(rl.limit));
    response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    return response;
  } catch (err) {
    console.error("[weekly-digest] unexpected error:", err);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
