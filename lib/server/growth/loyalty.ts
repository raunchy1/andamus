"use server";

/**
 * Loyalty & Streak System
 * =======================
 * Gamification to increase retention through streaks, badges, and rewards.
 * WHY: Habit formation is critical for retention. Streaks and rewards
 * create positive reinforcement loops that bring users back daily.
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";
import { logInfo } from "@/lib/server/observability/logging";

// ---------------------------------------------------------------------------
// Streak management
// ---------------------------------------------------------------------------

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakAtRisk: boolean;
  nextMilestone: number;
  daysUntilMilestone: number;
}

/**
 * Get user's activity streak.
 */
export async function getUserStreak(userId: string): Promise<StreakInfo> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, last_active_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      streakAtRisk: false,
      nextMilestone: 7,
      daysUntilMilestone: 7,
    };
  }

  const currentStreak = data.current_streak ?? 0;
  const lastActive = data.last_active_at ? new Date(data.last_active_at) : null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActiveDay = lastActive ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) : null;

  // Check if streak is at risk (not active today and not active yesterday)
  let streakAtRisk = false;
  if (lastActiveDay) {
    const daysDiff = (today.getTime() - lastActiveDay.getTime()) / 86400000;
    streakAtRisk = daysDiff >= 2;
  }

  // Calculate next milestone
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find((m) => m > currentStreak) ?? 365;
  const daysUntilMilestone = nextMilestone - currentStreak;

  return {
    currentStreak,
    longestStreak: data.longest_streak ?? 0,
    lastActiveDate: data.last_active_at,
    streakAtRisk,
    nextMilestone,
    daysUntilMilestone,
  };
}

/**
 * Record user activity and update streak.
 * Call this on meaningful interactions (booking, ride creation, message).
 */
export async function recordActivity(userId: string): Promise<StreakInfo> {
  const supabase = await createServiceRoleClient();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get current state
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, last_active_at")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return getUserStreak(userId);
  }

  const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null;
  const lastActiveDay = lastActive ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) : null;
  const daysDiff = lastActiveDay ? (today.getTime() - lastActiveDay.getTime()) / 86400000 : Infinity;

  let newStreak = profile.current_streak ?? 0;
  let newLongest = profile.longest_streak ?? 0;

  if (daysDiff === 0) {
    // Already active today — no streak change
  } else if (daysDiff === 1) {
    // Consecutive day — increment streak
    newStreak += 1;
  } else {
    // Streak broken — reset
    newStreak = 1;
  }

  if (newStreak > newLongest) {
    newLongest = newStreak;
  }

  // Update profile
  await supabase
    .from("profiles")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_at: now.toISOString(),
    })
    .eq("id", userId);

  // Check for streak milestones and award badges
  await checkStreakMilestones(userId, newStreak);

  logInfo("Activity recorded", { metadata: { userId, newStreak } });

  return getUserStreak(userId);
}

async function checkStreakMilestones(userId: string, streak: number): Promise<void> {
  const milestones = [
    { days: 7, badge: "week_warrior" },
    { days: 14, badge: "two_week_streak" },
    { days: 30, badge: "month_master" },
    { days: 60, badge: "dedicated_driver" },
    { days: 90, badge: "quarter_legend" },
    { days: 180, badge: "half_year_hero" },
    { days: 365, badge: "year_champion" },
  ];

  const supabase = await createServiceRoleClient();

  for (const milestone of milestones) {
    if (streak === milestone.days) {
      // Award badge
      await supabase.from("badges").upsert({
        user_id: userId,
        badge_type: milestone.badge,
        awarded_at: new Date().toISOString(),
      }, { onConflict: "user_id,badge_type" });

      // Award points
      const points = milestone.days * 10;
      await supabase.rpc("increment_user_points", {
        user_id: userId,
        points,
      });

      logInfo("Streak milestone reached", {
        metadata: { userId, streak: milestone.days, badge: milestone.badge, points },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Points & rewards
// ---------------------------------------------------------------------------

export interface UserPoints {
  totalPoints: number;
  level: number;
  pointsToNextLevel: number;
  perks: string[];
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];

export async function getUserPoints(userId: string): Promise<UserPoints> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("points, level")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { totalPoints: 0, level: 1, pointsToNextLevel: 100, perks: [] };
  }

  const points = data.points ?? 0;
  const currentLevel = data.level ?? 1;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const pointsToNext = Math.max(0, nextThreshold - points);

  const perks = getPerksForLevel(currentLevel);

  return {
    totalPoints: points,
    level: currentLevel,
    pointsToNextLevel: pointsToNext,
    perks,
  };
}

function getPerksForLevel(level: number): string[] {
  const perks: string[] = [];
  if (level >= 2) perks.push("Profile badge");
  if (level >= 3) perks.push("Priority support");
  if (level >= 5) perks.push("Free ride boost monthly");
  if (level >= 7) perks.push("Analytics dashboard");
  if (level >= 9) perks.push("VIP status");
  return perks;
}

/**
 * Award points for an action.
 */
export async function awardPoints(
  userId: string,
  action: string,
  points: number
): Promise<void> {
  const supabase = await createServiceRoleClient();

  await supabase.rpc("increment_user_points", {
    user_id: userId,
    points,
  });

  // Log the action
  await supabase.from("user_actions").insert({
    user_id: userId,
    action: `points_${action}`,
    metadata: { points, action },
  });

  logInfo("Points awarded", { metadata: { userId, action, points } });
}

// ---------------------------------------------------------------------------
// Retention notifications
// ---------------------------------------------------------------------------

export async function getStreakAtRiskUsers(): Promise<
  Array<{ userId: string; name: string; currentStreak: number }>
> {
  const supabase = await createServiceRoleClient();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, current_streak")
    .gt("current_streak", 0)
    .lt("last_active_at", `${yesterday}T00:00:00`)
    .limit(1000);

  if (error || !data) return [];

  return data.map((row) => ({
    userId: row.id,
    name: row.name ?? "",
    currentStreak: row.current_streak ?? 0,
  }));
}

/**
 * Send retention notifications to users whose streak is at risk.
 */
export async function sendStreakRecoveryNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  const users = await getStreakAtRiskUsers();
  let sent = 0;
  let failed = 0;

  const redis = getRedis();
  if (!redis) return { sent: 0, failed: 0 };

  for (const user of users) {
    try {
      await redis.lpush("queue:notifications", JSON.stringify({
        type: "streak_at_risk",
        userId: user.userId,
        streak: user.currentStreak,
      }));
      sent++;
    } catch {
      failed++;
    }
  }

  logInfo("Streak recovery notifications queued", { metadata: { sent, failed } });
  return { sent, failed };
}
