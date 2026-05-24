"use server";

import { createClient } from "@/lib/supabase/server";
import { getRedis } from "@/lib/redis";

export interface MatchScore {
  rideId: string;
  score: number;
  factors: {
    routeSimilarity: number;
    timeProximity: number;
    preferenceMatch: number;
    driverReliability: number;
    priceAffinity: number;
  };
}

export interface UserPreferences {
  smoking?: boolean | null;
  pets?: boolean | null;
  luggage?: boolean | null;
  womenOnly?: boolean | null;
  studentsOnly?: boolean | null;
  musicPreference?: string | null;
  preferredPriceRange?: { min: number; max: number };
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Normalize city name for comparison.
 */
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Compute route similarity score (0-1).
 */
function routeSimilarity(
  fromA: string,
  toA: string,
  fromB: string,
  toB: string
): number {
  const normFromA = normalizeCity(fromA);
  const normToA = normalizeCity(toA);
  const normFromB = normalizeCity(fromB);
  const normToB = normalizeCity(toB);

  if (normFromA === normFromB && normToA === normToB) return 1.0;

  const fromDist = levenshtein(normFromA, normFromB);
  const toDist = levenshtein(normToA, normToB);
  const maxLen = Math.max(normFromA.length, normFromB.length, normToA.length, normToB.length);
  if (maxLen === 0) return 0;

  const avgDist = (fromDist + toDist) / 2;
  return Math.max(0, 1 - avgDist / maxLen);
}

/**
 * Compute time proximity score (0-1).
 */
function timeProximity(
  dateA: string,
  timeA: string,
  dateB: string,
  timeB: string
): number {
  const dtA = new Date(`${dateA}T${timeA}`).getTime();
  const dtB = new Date(`${dateB}T${timeB}`).getTime();
  const diffHours = Math.abs(dtA - dtB) / (1000 * 60 * 60);
  return Math.max(0, 1 - diffHours / 24);
}

/**
 * Compute preference match score (0-1).
 */
function preferenceMatch(
  ride: {
    smoking_allowed?: boolean | null;
    pets_allowed?: boolean | null;
    large_luggage?: boolean | null;
    women_only?: boolean | null;
    students_only?: boolean | null;
    music_preference?: string | null;
    price?: number;
  },
  prefs: UserPreferences
): number {
  let score = 1;
  let checks = 0;

  if (prefs.smoking !== undefined && prefs.smoking !== null) {
    checks++;
    if (ride.smoking_allowed !== prefs.smoking) score -= 0.2;
  }
  if (prefs.pets !== undefined && prefs.pets !== null) {
    checks++;
    if (ride.pets_allowed !== prefs.pets) score -= 0.2;
  }
  if (prefs.luggage !== undefined && prefs.luggage !== null) {
    checks++;
    if (ride.large_luggage !== prefs.luggage) score -= 0.2;
  }
  if (prefs.womenOnly !== undefined && prefs.womenOnly !== null) {
    checks++;
    if (ride.women_only !== prefs.womenOnly) score -= 0.3;
  }
  if (prefs.studentsOnly !== undefined && prefs.studentsOnly !== null) {
    checks++;
    if (ride.students_only !== prefs.studentsOnly) score -= 0.3;
  }
  if (prefs.musicPreference) {
    checks++;
    if (ride.music_preference && ride.music_preference !== prefs.musicPreference) {
      score -= 0.1;
    }
  }
  if (prefs.preferredPriceRange && ride.price !== undefined) {
    checks++;
    const { min, max } = prefs.preferredPriceRange;
    if (ride.price < min || ride.price > max) score -= 0.2;
  }

  if (checks === 0) return 0.5;
  return Math.max(0, score);
}

/**
 * Get recommended rides for a user based on their history and preferences.
 */
export async function getRecommendedRides(
  userId: string,
  limit = 5
): Promise<MatchScore[]> {
  const cacheKey = `recommendations:${userId}`;
  const redis = getRedis();

  if (redis) {
    try {
      const cached = await redis.get<MatchScore[]>(cacheKey);
      if (cached) return cached;
    } catch {
      // Cache miss — proceed with calculation
    }
  }

  const supabase = await createClient();

  // Fetch user's booking history for pattern detection
  const { data: history } = await supabase
    .from("bookings")
    .select("rides(from_city, to_city, date, time, price, smoking_allowed, pets_allowed, large_luggage, women_only, students_only, music_preference)")
    .eq("passenger_id", userId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(10);

  // Derive preferences from history
  const prefs: UserPreferences = {};
  if (history && history.length > 0) {
    const rides = history.map((h) => (h as Record<string, unknown>).rides as unknown as Record<string, unknown>);
    const avgPrice = rides.reduce((sum, r) => sum + ((r.price as number) || 0), 0) / rides.length;
    prefs.preferredPriceRange = { min: 0, max: avgPrice * 1.5 };

    // Most common from/to cities
    const fromCities = rides.map((r) => r.from_city as string);
    const toCities = rides.map((r) => r.to_city as string);
    const commonFrom = mode(fromCities);
    const commonTo = mode(toCities);

    // Fetch active rides that match patterns
    const today = new Date().toISOString().split("T")[0];
    const { data: candidates } = await supabase
      .from("rides")
      .select(`id, from_city, to_city, date, time, price, seats, smoking_allowed, pets_allowed, large_luggage, women_only, students_only, music_preference, status, profiles!inner(name, avatar_url, rating, rides_count, review_count)`)
      .eq("status", "active")
      .gte("date", today)
      .limit(100);

    if (!candidates || candidates.length === 0) return [];

    const scored = (candidates as unknown as unknown[]).map((item) => {
      const r = item as Record<string, unknown>;
      const routeScore = routeSimilarity(
        commonFrom || "",
        commonTo || "",
        (r.from_city as string) || "",
        (r.to_city as string) || ""
      );
      const timeScore = history.length > 0
        ? timeProximity(
            (rides[0].date as string) || today,
            (rides[0].time as string) || "12:00",
            (r.date as string) || today,
            (r.time as string) || "12:00"
          )
        : 0.5;
      const prefScore = preferenceMatch(r as unknown as Parameters<typeof preferenceMatch>[0], prefs);
      const driverReliability = Math.min(1, ((r.profiles as Record<string, unknown>)?.rating as number || 5) / 5);
      const priceAffinity = prefs.preferredPriceRange
        ? Math.max(0, 1 - Math.abs(((r.price as number) || 0) - (prefs.preferredPriceRange.max / 2)) / (prefs.preferredPriceRange.max || 1))
        : 0.5;

      const totalScore =
        routeScore * 0.35 +
        timeScore * 0.20 +
        prefScore * 0.20 +
        driverReliability * 0.15 +
        priceAffinity * 0.10;

      return {
        rideId: r.id as string,
        score: Math.round(totalScore * 100) / 100,
        factors: {
          routeSimilarity: Math.round(routeScore * 100) / 100,
          timeProximity: Math.round(timeScore * 100) / 100,
          preferenceMatch: Math.round(prefScore * 100) / 100,
          driverReliability: Math.round(driverReliability * 100) / 100,
          priceAffinity: Math.round(priceAffinity * 100) / 100,
        },
      };
    });

    const results = scored
      .filter((s) => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (redis) {
      try {
        await redis.setex(cacheKey, 300, results); // Cache for 5 minutes
      } catch {
        // Cache write failure is non-blocking
      }
    }

    return results;
  }

  // No history — return trending rides
  const today = new Date().toISOString().split("T")[0];
  const { data: trending } = await supabase
    .from("rides")
    .select("id, from_city, to_city, date, time, price, profiles!inner(rating)")
    .eq("status", "active")
    .gte("date", today)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (trending || []).map((r) => ({
    rideId: (r as Record<string, unknown>).id as string,
    score: 0.5,
    factors: {
      routeSimilarity: 0,
      timeProximity: 0.5,
      preferenceMatch: 0.5,
      driverReliability: Math.min(1, ((r as Record<string, unknown>).profiles as Record<string, unknown>)?.rating as number / 5 || 0.5),
      priceAffinity: 0.5,
    },
  }));
}

function mode<T>(arr: T[]): T | undefined {
  const counts = new Map<T, number>();
  let maxCount = 0;
  let maxItem: T | undefined;
  for (const item of arr) {
    const count = (counts.get(item) || 0) + 1;
    counts.set(item, count);
    if (count > maxCount) {
      maxCount = count;
      maxItem = item;
    }
  }
  return maxItem;
}

/**
 * Find rides similar to a given ride (for "similar rides" feature).
 */
export async function findSimilarRides(
  rideId: string,
  limit = 3
): Promise<{ id: string; score: number }[]> {
  const supabase = await createClient();

  const { data: ride } = await supabase
    .from("rides")
    .select("from_city, to_city, date, time, price, smoking_allowed, pets_allowed, large_luggage, women_only, students_only, music_preference")
    .eq("id", rideId)
    .single();

  if (!ride) return [];

  const today = new Date().toISOString().split("T")[0];
  const { data: candidates } = await supabase
    .from("rides")
    .select("id, from_city, to_city, date, time, price, smoking_allowed, pets_allowed, large_luggage, women_only, students_only, music_preference")
    .eq("status", "active")
    .neq("id", rideId)
    .gte("date", today)
    .limit(50);

  if (!candidates) return [];

  const scored = candidates.map((c) => {
    const r = c as Record<string, unknown>;
    const routeScore = routeSimilarity(
      (ride.from_city as string) || "",
      (ride.to_city as string) || "",
      (r.from_city as string) || "",
      (r.to_city as string) || ""
    );
    const timeScore = timeProximity(
      (ride.date as string) || today,
      (ride.time as string) || "12:00",
      (r.date as string) || today,
      (r.time as string) || "12:00"
    );
    const prefScore = preferenceMatch(
      r as unknown as Parameters<typeof preferenceMatch>[0],
      {
        smoking: ride.smoking_allowed,
        pets: ride.pets_allowed,
        luggage: ride.large_luggage,
        womenOnly: ride.women_only,
        studentsOnly: ride.students_only,
        musicPreference: ride.music_preference || undefined,
      }
    );
    const priceScore = ride.price !== null && ride.price !== undefined
      ? Math.max(0, 1 - Math.abs(((r.price as number) || 0) - ride.price) / Math.max(ride.price, 1))
      : 0.5;

    const score = routeScore * 0.4 + timeScore * 0.25 + prefScore * 0.2 + priceScore * 0.15;
    return { id: r.id as string, score: Math.round(score * 100) / 100 };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
