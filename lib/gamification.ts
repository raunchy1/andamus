import { createClient } from "./supabase/client";

const supabase = createClient();

// Points configuration
export const POINTS = {
  FIRST_RIDE: 50,      // Pubblica prima corsa
  RIDE_PUBLISHED: 10,  // Ogni corsa pubblicata
  BOOKING_CONFIRMED: 15, // Ogni prenotazione confermata
  FIVE_STAR_REVIEW: 20,  // Riceve recensione 5 stelle
  IDENTITY_VERIFIED: 30, // Completa verifica identità
};

// Levels configuration
export const LEVELS = [
  { min: 0, max: 99, name: "Viaggiatore", emoji: "🚗" },
  { min: 100, max: 299, name: "Esploratore", emoji: "🗺️" },
  { min: 300, max: 599, name: "Sardo DOC", emoji: "🦁" },
  { min: 600, max: 999, name: "Re della Strada", emoji: "👑" },
  { min: 1000, max: Infinity, name: "Leggenda Sarda", emoji: "⭐" },
];

// Badges configuration
export const BADGES = {
  FIRST_RIDE: {
    type: "first_ride",
    name: "Prima Corsa",
    description: "Hai pubblicato la tua prima corsa",
    icon: "🚗",
    color: "bg-blue-500",
  },
  WELCOME: {
    type: "welcome",
    name: "Benvenuto",
    description: "Profilo completato",
    icon: "👋",
    color: "bg-green-500",
  },
  VERIFIED: {
    type: "verified",
    name: "Verificato",
    description: "Identità verificata",
    icon: "✅",
    color: "bg-purple-500",
  },
  FIVE_STARS: {
    type: "five_stars",
    name: "5 Stelle",
    description: "Hai ricevuto la tua prima recensione 5 stelle",
    icon: "⭐",
    color: "bg-yellow-500",
  },
  HABITUE: {
    type: "habitue",
    name: "Habitué",
    description: "10 corse pubblicate",
    icon: "🎯",
    color: "bg-orange-500",
  },
  AMBASSADOR: {
    type: "ambassador",
    name: "Ambasciatore",
    description: "50 corse pubblicate",
    icon: "🏆",
    color: "bg-red-500",
  },
};

// Add points to user
export async function addPoints(userId: string, points: number): Promise<{
  success: boolean;
  newPoints?: number;
  newLevel?: string;
  leveledUp?: boolean;
  error?: string;
}> {
  try {
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
  } catch (error) {
    // console.error("Error adding points:", error);
    return { success: false, error: "Failed to add points" };
  }
}

// Award badge to user
export async function awardBadge(
  userId: string,
  badgeType: string
): Promise<{ success: boolean; awarded: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("check_and_award_badge", {
      user_uuid: userId,
      badge_type: badgeType,
    });

    if (error) throw error;

    return {
      success: true,
      awarded: data,
    };
  } catch (error) {
    // console.error("Error awarding badge:", error);
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
    // Get user's ride count
    const { count: rideCount, error: countError } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", userId);

    if (countError) throw countError;

    // Check for first ride badge
    if (rideCount && rideCount >= 1) {
      const result = await awardBadge(userId, BADGES.FIRST_RIDE.type);
      if (result.success && result.awarded) {
        newBadges.push(BADGES.FIRST_RIDE.type);
      }
    }

    // Check for habitue badge (10 rides)
    if (rideCount && rideCount >= 10) {
      const result = await awardBadge(userId, BADGES.HABITUE.type);
      if (result.success && result.awarded) {
        newBadges.push(BADGES.HABITUE.type);
      }
    }

    // Check for ambassador badge (50 rides)
    if (rideCount && rideCount >= 50) {
      const result = await awardBadge(userId, BADGES.AMBASSADOR.type);
      if (result.success && result.awarded) {
        newBadges.push(BADGES.AMBASSADOR.type);
      }
    }

    return { success: true, newBadges };
  } catch (error) {
    // console.error("Error checking ride badges:", error);
    return { success: false, newBadges };
  }
}

// Get user's badges
export interface Badge {
  id?: string;
  user_id?: string;
  type?: string;
  earned_at?: string;
  [key: string]: unknown;
}

export async function getUserBadges(userId: string): Promise<{
  success: boolean;
  badges?: Badge[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) throw error;

    return { success: true, badges: data || [] };
  } catch (error) {
    // console.error("Error getting badges:", error);
    return { success: false, error: "Failed to get badges" };
  }
}

// Get level info
export function getLevelInfo(points: number): {
  current: typeof LEVELS[0];
  next: typeof LEVELS[0] | null;
  progress: number;
} {
  const current = LEVELS.find((l) => points >= l.min && points <= l.max) || LEVELS[0];
  const currentIndex = LEVELS.findIndex((l) => l.name === current.name);
  const next = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  // Calculate progress percentage
  let progress = 100;
  if (next) {
    const range = next.min - current.min;
    const earned = points - current.min;
    progress = Math.min(100, Math.max(0, (earned / range) * 100));
  }

  return { current, next, progress };
}

// Get badge details by type
export function getBadgeDetails(badgeType: string) {
  return (
    Object.values(BADGES).find((b) => b.type === badgeType) || {
      type: badgeType,
      name: badgeType,
      description: "",
      icon: "🏅",
      color: "bg-gray-500",
    }
  );
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

  // Add points based on action
  let points = 0;
  switch (action) {
    case "ride_published":
      points = isFirstRide ? POINTS.FIRST_RIDE : POINTS.RIDE_PUBLISHED;
      break;
    case "booking_confirmed":
      points = POINTS.BOOKING_CONFIRMED;
      break;
    case "five_star_review":
      points = POINTS.FIVE_STAR_REVIEW;
      break;
    case "identity_verified":
      points = POINTS.IDENTITY_VERIFIED;
      break;
  }

  // Add points
  const pointsResult = await addPoints(userId, points);
  if (pointsResult.success) {
    result.pointsAdded = points;
    result.newPoints = pointsResult.newPoints;
    result.newLevel = pointsResult.newLevel;
    result.leveledUp = pointsResult.leveledUp;
  }

  // Check for badges
  if (action === "ride_published") {
    const badgeResult = await checkRideBadges(userId);
    result.newBadges = badgeResult.newBadges;
  }

  // Award 5 stars badge
  if (action === "five_star_review") {
    const badgeResult = await awardBadge(userId, BADGES.FIVE_STARS.type);
    if (badgeResult.success && badgeResult.awarded) {
      result.newBadges.push(BADGES.FIVE_STARS.type);
    }
  }

  // Award verified badge
  if (action === "identity_verified") {
    const badgeResult = await awardBadge(userId, BADGES.VERIFIED.type);
    if (badgeResult.success && badgeResult.awarded) {
      result.newBadges.push(BADGES.VERIFIED.type);
    }
  }

  return result;
}
