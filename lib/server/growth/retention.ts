"use server";

/**
 * Retention & Churn Analysis
 * ==========================
 * Cohort analysis, churn prediction, and re-engagement automation.
 * WHY: Retention is cheaper than acquisition. Understanding why users
 * churn enables targeted interventions before they leave.
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";
import { logInfo } from "@/lib/server/observability/logging";

// ---------------------------------------------------------------------------
// Cohort analysis
// ---------------------------------------------------------------------------

export interface CohortRow {
  signupWeek: string;
  totalUsers: number;
  retention: Record<string, number>; // day -> percentage
}

/**
 * Compute retention cohorts for the last N weeks.
 */
export async function getRetentionCohorts(weeks = 12): Promise<CohortRow[]> {
  const supabase = await createServiceRoleClient();

  const startDate = new Date(Date.now() - weeks * 7 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, created_at, last_active_at")
    .gte("created_at", startDate)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // Group by signup week
  const cohorts = new Map<string, Array<{ id: string; createdAt: Date; lastActiveAt: Date | null }>>();

  for (const row of data) {
    const createdAt = new Date(row.created_at);
    const weekKey = getWeekKey(createdAt);

    if (!cohorts.has(weekKey)) cohorts.set(weekKey, []);
    cohorts.get(weekKey)!.push({
      id: row.id,
      createdAt,
      lastActiveAt: row.last_active_at ? new Date(row.last_active_at) : null,
    });
  }

  const result: CohortRow[] = [];

  for (const [weekKey, users] of cohorts.entries()) {
    const retention: Record<string, number> = {};

    for (let day = 0; day <= 30; day += 1) {
      const activeCount = users.filter((u) => {
        if (!u.lastActiveAt) return false;
        const daysSinceSignup = (u.lastActiveAt.getTime() - u.createdAt.getTime()) / 86400000;
        return daysSinceSignup >= day && daysSinceSignup < day + 1;
      }).length;

      retention[String(day)] = users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0;
    }

    result.push({
      signupWeek: weekKey,
      totalUsers: users.length,
      retention,
    });
  }

  return result.reverse();
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Churn risk scoring
// ---------------------------------------------------------------------------

export interface ChurnRisk {
  userId: string;
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high";
  factors: string[];
  daysSinceLastActivity: number;
}

/**
 * Identify users at risk of churning.
 * Factors: days inactive, no bookings, low engagement, streak broken.
 */
export async function identifyChurnRiskUsers(limit = 500): Promise<ChurnRisk[]> {
  const supabase = await createServiceRoleClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, last_active_at, rides_count, current_streak, created_at")
    .lt("last_active_at", thirtyDaysAgo)
    .gt("rides_count", 0) // Only users who were active
    .limit(limit);

  if (error || !data) return [];

  return data.map((user) => {
    const factors: string[] = [];
    let score = 0;

    const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
    const daysInactive = lastActive
      ? Math.floor((Date.now() - lastActive.getTime()) / 86400000)
      : 999;

    // Days inactive (0-40 pts)
    score += Math.min(40, daysInactive);
    if (daysInactive > 14) factors.push("inactive_14d");
    if (daysInactive > 30) factors.push("inactive_30d");

    // Low ride count (0-20 pts)
    const ridesCount = user.rides_count ?? 0;
    if (ridesCount < 3) {
      score += 20;
      factors.push("low_engagement");
    }

    // Broken streak (0-20 pts)
    const streak = user.current_streak ?? 0;
    if (streak === 0) {
      score += 20;
      factors.push("streak_broken");
    }

    // Account age (new users churn faster) (0-20 pts)
    const accountAge = new Date(user.created_at).getTime();
    const daysOld = (Date.now() - accountAge) / 86400000;
    if (daysOld < 30) {
      score += 10;
      factors.push("new_user");
    }

    score = Math.min(100, score);

    return {
      userId: user.id,
      riskScore: score,
      riskLevel: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
      factors,
      daysSinceLastActivity: daysInactive,
    };
  });
}

// ---------------------------------------------------------------------------
// Re-engagement campaigns
// ---------------------------------------------------------------------------

export interface ReEngagementCampaign {
  userId: string;
  campaignType: "streak_recovery" | "new_rides" | "discount" | "social";
  message: string;
  scheduledFor: string;
}

/**
 * Generate re-engagement campaigns for at-risk users.
 */
export async function generateReEngagementCampaigns(): Promise<{
  campaigns: ReEngagementCampaign[];
  highRiskCount: number;
}> {
  const atRiskUsers = await identifyChurnRiskUsers(1000);
  const highRisk = atRiskUsers.filter((u) => u.riskLevel === "high");

  const campaigns: ReEngagementCampaign[] = [];

  for (const user of highRisk) {
    let campaignType: ReEngagementCampaign["campaignType"] = "new_rides";
    let message = "";

    if (user.factors.includes("streak_broken") && user.factors.includes("inactive_14d")) {
      campaignType = "streak_recovery";
      message = "Manca poco per perdere la tua serie! Torna oggi per mantenerla attiva.";
    } else if (user.daysSinceLastActivity > 30) {
      campaignType = "discount";
      message = "Ti manchiamo! Ecco uno sconto speciale per la tua prossima corsa.";
    } else {
      campaignType = "social";
      message = "I tuoi amici stanno pianificando nuovi viaggi. Unisciti a loro!";
    }

    campaigns.push({
      userId: user.userId,
      campaignType,
      message,
      scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    });
  }

  // Queue campaigns
  const redis = getRedis();
  if (redis) {
    for (const campaign of campaigns) {
      await redis.lpush("queue:notifications", JSON.stringify({
        type: "re_engagement",
        ...campaign,
      }));
    }
  }

  logInfo("Re-engagement campaigns generated", {
    metadata: { highRiskCount: highRisk.length, campaignsQueued: campaigns.length },
  });

  return { campaigns, highRiskCount: highRisk.length };
}

// ---------------------------------------------------------------------------
// Activation tracking
// ---------------------------------------------------------------------------

export interface ActivationFunnel {
  signedUp: number;
  completedProfile: number;
  searchedRides: number;
  createdOrBooked: number;
  completedRide: number;
}

/**
 * Get activation funnel for a cohort of users.
 */
export async function getActivationFunnel(signupDate: string): Promise<ActivationFunnel> {
  const supabase = await createServiceRoleClient();

  const { count: signedUp } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${signupDate}T00:00:00`)
    .lt("created_at", `${signupDate}T23:59:59`);

  const { count: completedProfile } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${signupDate}T00:00:00`)
    .lt("created_at", `${signupDate}T23:59:59`)
    .not("name", "is", null)
    .neq("name", "");

  const { count: createdOrBooked } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${signupDate}T00:00:00`)
    .lt("created_at", `${signupDate}T23:59:59`)
    .gt("rides_count", 0);

  return {
    signedUp: signedUp ?? 0,
    completedProfile: completedProfile ?? 0,
    searchedRides: 0, // Would need search action tracking
    createdOrBooked: createdOrBooked ?? 0,
    completedRide: 0, // Would need ride completion tracking
  };
}

/**
 * Dynamic Seasonal Campaigns and Student/Summer Commute Retention Engine.
 * Tailors re-engagement pushes based on calendar context (exam seasons, summer beach corridors).
 */
export async function runSeasonalCampaignEngine() {
  const supabase = createServiceRoleClient();
  const redis = getRedis();

  // Get current date context in Rome time zone
  const romeTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" });
  const currentDate = new Date(romeTime);
  const currentMonth = currentDate.getMonth(); // 0 = Jan, 11 = Dec
  const currentHour = currentDate.getHours();

  // Enforce quiet hours at re-engagement push level (22:00 - 07:00 Rome time)
  if (currentHour >= 22 || currentHour < 7) {
    console.log("[seasonal-campaign] Quiet hours active. Skipping execution.");
    return { success: true, message: "Quiet hours active, notifications deferred." };
  }

  // 1. Determine active campaign context based on calendar month
  let campaignType: "exams" | "summer" | "commute" = "commute";
  let title = "Viaggia con Andamus! 🚗";
  let body = "Risparmia sulle spese di viaggio condividendo il tuo tragitto in Sardegna.";
  let targetRoute = { from: "Cagliari", to: "Sassari" };

  // January, February, June, July, September, October -> University Exam Seasons
  if ([0, 1, 5, 6, 8, 9].includes(currentMonth)) {
    campaignType = "exams";
    title = "Sessione Esami Attiva! 📚";
    body = "Rientra a casa per il weekend con Andamus. Trova un passaggio conveniente o offri posti in auto!";
    targetRoute = { from: "Sassari", to: "Cagliari" };
  }
  // June, July, August, September -> Summer Beach and Airport Corridors
  else if ([5, 6, 7, 8].includes(currentMonth)) {
    campaignType = "summer";
    title = "Traffico Estivo in Sardegna ☀️";
    body = "Evita code e stress da parcheggio per spiagge ed aeroporti. Condividi il viaggio ed esplora senza pensieri!";
    targetRoute = { from: "Cagliari", to: "Villasimius" };
  }

  console.log(`[seasonal-campaign] Triggering seasonal re-engagement: ${campaignType.toUpperCase()} campaign.`);

  // 2. Fetch users who have been inactive in the last 10 days
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const { data: inactiveProfiles, error } = await supabase
    .from("profiles")
    .select("id")
    .lt("last_active_at", tenDaysAgo.toISOString())
    .limit(100);

  if (error || !inactiveProfiles || inactiveProfiles.length === 0) {
    return { success: true, message: "No dormant users found for campaign nudging." };
  }

  const { sendPushToUser } = await import("@/lib/server/actions/notifications");
  const { captureEvent } = await import("@/lib/posthog");

  let nudgeCount = 0;

  for (const profile of inactiveProfiles) {
    try {
      // 3. Enforce 24-hour re-engagement cooldown lock in Redis
      if (redis) {
        const cooldownKey = `retention:seasonal:cooldown:${profile.id}`;
        const hasCooldown = await redis.get(cooldownKey);
        if (hasCooldown) continue;
      }

      const url = `/it/cerca?from=${encodeURIComponent(targetRoute.from)}&to=${encodeURIComponent(targetRoute.to)}`;

      // 4. Send Push & Save Notification Entry
      await sendPushToUser({
        userId: profile.id,
        title,
        body,
        url,
      });

      await supabase.from("notifications").insert({
        user_id: profile.id,
        type: "ride_alert",
        title,
        body,
        ride_id: null,
        booking_id: null,
        read: false,
      });

      // 5. Activate Cooldown lock for 24 hours
      if (redis) {
        const cooldownKey = `retention:seasonal:cooldown:${profile.id}`;
        await redis.set(cooldownKey, "active", { ex: 86400 });
      }

      captureEvent("seasonal_campaign_pushed", {
        user_id: profile.id,
        campaign_type: campaignType,
        target_route: `${targetRoute.from}->${targetRoute.to}`,
      });

      nudgeCount++;
    } catch (err) {
      console.error(`[seasonal-campaign] Error nudging user ${profile.id}:`, err);
    }
  }

  return {
    success: true,
    campaign: campaignType,
    nudgedCount: nudgeCount,
  };
}
