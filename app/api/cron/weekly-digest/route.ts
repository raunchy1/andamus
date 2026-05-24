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
  name: string;
  locale: string;
  streak_weeks: number;
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

    // Fetch users with active streaks
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, full_name, locale, streak_weeks")
      .gt("streak_weeks", 0)
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

        const { data: rides, error: ridesError } = await supabase
          .from("rides")
          .select("from_city, to_city, date, time, price, profiles!inner(full_name)")
          .or(`driver_id.eq.${user.id},bookings.passenger_id.eq.${user.id}`)
          .gte("date", oneWeekAgoStr)
          .eq("status", "completed")
          .returns<WeeklyRide[]>();

        if (ridesError) {
          errors.push(`User ${user.id}: rides fetch error`);
          continue;
        }

        const hasStreak = user.streak_weeks > 0;

        const result = await sendWeeklyDigestEmail({
          to: user.email,
          name: user.name,
          rides: rides || [],
          hasStreak,
          streakWeeks: user.streak_weeks,
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
