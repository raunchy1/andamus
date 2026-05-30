"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Retention system: streaks, activity tracking, and re-engagement helpers.
 */

export interface ActivityStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveWeek: string | null;
  totalWeeksActive: number;
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1); // Monday of this week
  return d.toISOString().split("T")[0];
}

/**
 * Record user activity for streak tracking.
 * Called on meaningful actions: ride created, booking made, review submitted.
 */
export async function recordActivity(userId: string, action: "ride_published" | "booking_made" | "review_submitted") {
  try {
    const sr = createServiceRoleClient();
    const weekKey = getWeekKey(new Date());

    // Upsert activity record for this week
    const { error } = await sr.from("user_activity_weeks").upsert(
      {
        user_id: userId,
        week_key: weekKey,
        [action]: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,week_key" }
    );

    if (error) {
      console.error("[retention] recordActivity error:", error.message);
    }
  } catch (err) {
    console.error("[retention] recordActivity error (fallback):", err);
  }
}

/**
 * Compute a user's activity streak from weekly activity records.
 */
export async function getActivityStreak(userId: string): Promise<ActivityStreak> {
  try {
    const sr = createServiceRoleClient();

    const { data, error } = await sr
      .from("user_activity_weeks")
      .select("week_key")
      .eq("user_id", userId)
      .order("week_key", { ascending: false });

    if (error || !data || data.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActiveWeek: null, totalWeeksActive: 0 };
    }

    const weeks = data.map((d) => d.week_key);
    const totalWeeksActive = weeks.length;
    const lastActiveWeek = weeks[0];

    // Compute current streak (consecutive weeks ending now or last week)
    const nowWeek = getWeekKey(new Date());
    const lastWeek = getWeekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const weekSet = new Set(weeks);

    // Current streak
    if (weekSet.has(nowWeek)) {
      currentStreak = 1;
      let checkWeek = nowWeek;
      while (true) {
        const prev = new Date(new Date(checkWeek).getTime() - 7 * 24 * 60 * 60 * 1000);
        const prevKey = prev.toISOString().split("T")[0];
        if (weekSet.has(prevKey)) {
          currentStreak++;
          checkWeek = prevKey;
        } else break;
      }
    } else if (weekSet.has(lastWeek)) {
      currentStreak = 1;
      let checkWeek = lastWeek;
      while (true) {
        const prev = new Date(new Date(checkWeek).getTime() - 7 * 24 * 60 * 60 * 1000);
        const prevKey = prev.toISOString().split("T")[0];
        if (weekSet.has(prevKey)) {
          currentStreak++;
          checkWeek = prevKey;
        } else break;
      }
    }

    // Longest streak
    const sorted = [...weeks].sort();
    longestStreak = 1;
    tempStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(new Date(sorted[i]).getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevKey = prev.toISOString().split("T")[0];
      if (sorted[i - 1] === prevKey) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { currentStreak, longestStreak, lastActiveWeek, totalWeeksActive };
  } catch (err) {
    console.error("[retention] getActivityStreak error (fallback):", err);
    return { currentStreak: 0, longestStreak: 0, lastActiveWeek: null, totalWeeksActive: 0 };
  }
}

/**
 * Get inactive users who haven't had activity in the last N days.
 * Used for re-engagement emails.
 */
export async function getInactiveUsers(daysInactive: number) {
  try {
    const sr = createServiceRoleClient();
    const cutoff = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sr
      .from("profiles")
      .select("id, name, email")
      .lt("last_active_at", cutoff)
      .eq("email_marketing", true);

    if (error) {
      console.error("[retention] getInactiveUsers error:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[retention] getInactiveUsers error (fallback):", err);
    return [];
  }
}

/**
 * Check if a free user has exceeded their monthly ride limit.
 */
export async function checkRideLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
  try {
    const sr = createServiceRoleClient();

    // Get user plan
    const { data: profile } = await sr
      .from("profiles")
      .select("subscription_plan, subscription_status")
      .eq("id", userId)
      .single();

    const plan = profile?.subscription_plan || "free";
    const isActive = profile?.subscription_status === "active";

    // Limits
    const limits: Record<string, number> = {
      free: 3,
      premium: Infinity,
      driver: Infinity,
    };

    const limit = isActive && plan !== "free" ? Infinity : (limits[plan] ?? limits.free);
    if (limit === Infinity) return { allowed: true, limit: Infinity, used: 0 };

    // Count rides this month
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const { count, error } = await sr
      .from("rides")
      .select("id", { count: "exact", head: true })
      .eq("driver_id", userId)
      .gte("created_at", monthStart);

    if (error) {
      console.error("[retention] checkRideLimit error:", error.message);
      return { allowed: true, limit, used: 0 };
    }

    const used = count || 0;
    return { allowed: used < limit, limit, used };
  } catch (err) {
    console.error("[retention] checkRideLimit error (fallback):", err);
    return { allowed: true, limit: 3, used: 0 };
  }
}
