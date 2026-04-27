"use server";

import { createClient } from "./supabase/server";
import { BADGES } from "./gamification-config";

// Add points to user (server-only, auth verified by RLS/RPC)
export async function addPoints(userId: string, points: number): Promise<{
  success: boolean;
  newPoints?: number;
  newLevel?: string;
  leveledUp?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("add_user_points", {
      user_uuid: userId,
      points_to_add: points,
    });

    if (error) throw error;

    return {
      success: true,
      newPoints: data[0].new_points,
      newLevel: data[0].new_level,
      leveledUp: data[0].leveled_up,
    };
  } catch {
    return { success: false, error: "Failed to add points" };
  }
}

// Award badge to user
export async function awardBadge(
  userId: string,
  badgeType: string
): Promise<{ success: boolean; awarded: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_and_award_badge", {
      user_uuid: userId,
      badge_type: badgeType,
    });

    if (error) throw error;

    return {
      success: true,
      awarded: data,
    };
  } catch {
    return { success: false, awarded: false, error: "Failed to award badge" };
  }
}

// Check and award ride-related badges
export async function checkRideBadges(userId: string): Promise<{
  success: boolean;
  newBadges: string[];
}> {
  const newBadges: string[] = [];

  try {
    const supabase = await createClient();
    const { count: rideCount, error: countError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", userId);

    if (countError) throw countError;

    if (rideCount && rideCount >= 1) {
      const result = await awardBadge(userId, BADGES.FIRST_RIDE.type);
      if (result.success && result.awarded) {
        newBadges.push(BADGES.FIRST_RIDE.type);
      }
    }

    if (rideCount && rideCount >= 10) {
      const result = await awardBadge(userId, BADGES.HABITUE.type);
      if (result.success && result.awarded) {
        newBadges.push(BADGES.HABITUE.type);
      }
    }

    if (rideCount && rideCount >= 50) {
      const result = await awardBadge(userId, BADGES.AMBASSADOR.type);
      if (result.success && result.awarded) {
        newBadges.push(BADGES.AMBASSADOR.type);
      }
    }

    return { success: true, newBadges };
  } catch {
    return { success: false, newBadges };
  }
}

// Get user's badges
export async function getUserBadges(userId: string): Promise<{
  success: boolean;
  badges?: { id?: string; user_id?: string; type?: string; earned_at?: string }[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) throw error;

    return { success: true, badges: data || [] };
  } catch {
    return { success: false, error: "Failed to get badges" };
  }
}

// Complete gamification action
export async function completeGamificationAction(
  userId: string,
  action: "ride_published" | "booking_confirmed" | "five_star_review" | "identity_verified",
  isFirstRide: boolean = false
): Promise<{
  pointsAdded: number;
  newPoints?: number;
  newLevel?: string;
  leveledUp?: boolean;
  newBadges: string[];
}> {
  const result: {
    pointsAdded: number;
    newPoints?: number;
    newLevel?: string;
    leveledUp?: boolean;
    newBadges: string[];
  } = {
    pointsAdded: 0,
    newBadges: [],
  };

  let points = 0;
  switch (action) {
    case "ride_published":
      points = isFirstRide ? 50 : 10;
      break;
    case "booking_confirmed":
      points = 15;
      break;
    case "five_star_review":
      points = 20;
      break;
    case "identity_verified":
      points = 30;
      break;
  }

  const pointsResult = await addPoints(userId, points);
  if (pointsResult.success) {
    result.pointsAdded = points;
    result.newPoints = pointsResult.newPoints;
    result.newLevel = pointsResult.newLevel;
    result.leveledUp = pointsResult.leveledUp;
  }

  if (action === "ride_published") {
    const badgeResult = await checkRideBadges(userId);
    result.newBadges = badgeResult.newBadges;
  }

  if (action === "five_star_review") {
    const badgeResult = await awardBadge(userId, BADGES.FIVE_STARS.type);
    if (badgeResult.success && badgeResult.awarded) {
      result.newBadges.push(BADGES.FIVE_STARS.type);
    }
  }

  if (action === "identity_verified") {
    const badgeResult = await awardBadge(userId, BADGES.VERIFIED.type);
    if (badgeResult.success && badgeResult.awarded) {
      result.newBadges.push(BADGES.VERIFIED.type);
    }
  }

  return result;
}
