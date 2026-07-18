"use server";

/**
 * Personalized Home Feed
 * ======================
 * Generates a personalized feed of rides, users, groups, and events
 * based on user behavior, preferences, and social signals.
 *
 * WHY: A generic homepage converts poorly. Personalized feeds increase
 * engagement, retention, and ride bookings by surfacing relevant content.
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { cacheGetSwr, cacheSet, CacheKeys, CacheTags } from "@/lib/server/cache";
import { computeUserFeatures, type UserFeatures } from "@/lib/server/ai/embeddings";
import { logInfo } from "@/lib/server/observability/logging";

// ---------------------------------------------------------------------------
// Feed item types
// ---------------------------------------------------------------------------

export type FeedItemType = "ride" | "user" | "group" | "event" | "trending" | "notification";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  score: number;
  reason: string;
  data: Record<string, unknown>;
  freshUntil: string; // ISO date
}

export interface PersonalizedFeed {
  userId: string;
  items: FeedItem[];
  generatedAt: string;
  expiresAt: string;
  totalItems: number;
  sections: {
    recommendedRides: number;
    suggestedUsers: number;
    trending: number;
    nearbyEvents: number;
  };
}

// ---------------------------------------------------------------------------
// Feed generation
// ---------------------------------------------------------------------------

/**
 * Generate a personalized home feed for a user.
 * Combines multiple signals: booking history, location, trust score,
 * social connections, and trending content.
 */
export async function generatePersonalizedFeed(
  userId: string,
  options?: { limit?: number; includeTypes?: FeedItemType[] }
): Promise<PersonalizedFeed> {
  const limit = Math.min(options?.limit ?? 20, 50);
  const includeTypes = options?.includeTypes ?? ["ride", "user", "group", "event", "trending"];

  // Get user features
  let features: UserFeatures | null = null;
  try {
    features = await computeUserFeatures(userId);
  } catch {
    // Continue without features
  }

  const items: FeedItem[] = [];

  // 1. Recommended rides (based on booking history patterns)
  if (includeTypes.includes("ride")) {
    const rides = await getRecommendedRidesForFeed(userId, features, Math.ceil(limit * 0.4));
    items.push(...rides);
  }

  // 2. Suggested users (drivers on preferred routes)
  if (includeTypes.includes("user")) {
    const users = await getSuggestedUsersForFeed(userId, features, Math.ceil(limit * 0.2));
    items.push(...users);
  }

  // 3. Trending content (popular routes, new drivers)
  if (includeTypes.includes("trending")) {
    const trending = await getTrendingForFeed(Math.ceil(limit * 0.2));
    items.push(...trending);
  }

  // 4. Nearby events
  if (includeTypes.includes("event")) {
    const events = await getNearbyEventsForFeed(Math.ceil(limit * 0.2));
    items.push(...events);
  }

  // Sort by score (descending)
  items.sort((a, b) => b.score - a.score);

  // Deduplicate by ID
  const seen = new Set<string>();
  const deduplicated = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const result: PersonalizedFeed = {
    userId,
    items: deduplicated.slice(0, limit),
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 min cache
    totalItems: deduplicated.length,
    sections: {
      recommendedRides: items.filter((i) => i.type === "ride").length,
      suggestedUsers: items.filter((i) => i.type === "user").length,
      trending: items.filter((i) => i.type === "trending").length,
      nearbyEvents: items.filter((i) => i.type === "event").length,
    },
  };

  // Cache the feed
  await cacheSet(CacheKeys.recommendations(userId), result, {
    ttlSeconds: 300,
    tags: [CacheTags.user(userId)],
  });

  logInfo("Generated personalized feed", {
    metadata: { userId, items: result.totalItems },
  });

  return result;
}

/**
 * Get personalized feed with SWR caching.
 */
export async function getPersonalizedFeed(
  userId: string,
  options?: { limit?: number }
): Promise<PersonalizedFeed> {
  const cacheKey = CacheKeys.recommendations(userId);

  const result = await cacheGetSwr(
    cacheKey,
    () => generatePersonalizedFeed(userId, options),
    { ttlSeconds: 300, tags: [CacheTags.user(userId)] }
  );

  return result.data;
}

// ---------------------------------------------------------------------------
// Feed section generators
// ---------------------------------------------------------------------------

async function getRecommendedRidesForFeed(
  userId: string,
  features: UserFeatures | null,
  limit: number
): Promise<FeedItem[]> {
  const supabase = await createServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("rides")
    .select(`
      id, driver_id, from_city, to_city, date, time, seats, price, status,
      profiles!inner(name, avatar_url, rating, review_count)
    `)
    .eq("status", "active")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(limit * 2);

  // Filter by preferred cities if available
  if (features?.preferredFromCities?.length) {
    query = query.in("from_city", features.preferredFromCities);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((ride) => {
    let score = 50;
    const reasons: string[] = [];

    // Boost for preferred routes
    if (features?.preferredFromCities?.includes(ride.from_city as string)) {
      score += 15;
      reasons.push("Percorso preferito");
    }
    if (features?.preferredToCities?.includes(ride.to_city as string)) {
      score += 15;
      reasons.push("Destinazione preferita");
    }

    // Boost for high-rated drivers
    const driverRating = ((ride.profiles as Record<string, unknown>)?.rating as number) ?? 5;
    if (driverRating >= 4.5) {
      score += 10;
      reasons.push("Autista top-rated");
    }

    // Boost for free rides
    if ((ride.price as number) === 0) {
      score += 5;
      reasons.push("Corsa gratuita");
    }

    // Penalize if user is the driver
    if (ride.driver_id === userId) {
      score = 0;
    }

    return {
      id: `ride:${ride.id}`,
      type: "ride" as const,
      score: Math.min(100, score),
      reason: reasons.join(", ") || "Corsa consigliata",
      data: ride,
      freshUntil: `${ride.date}T${ride.time ?? "23:59:00"}`,
    };
  }).filter((item) => item.score > 0);
}

async function getSuggestedUsersForFeed(
  userId: string,
  features: UserFeatures | null,
  limit: number
): Promise<FeedItem[]> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, rating, review_count, rides_count, completed_rides_count, from_city")
    .gt("rides_count", 0)
    .neq("id", userId)
    .order("rating", { ascending: false })
    .limit(limit * 2);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((profile) => {
    let score = 40;
    const reasons: string[] = [];

    const rating = (profile.rating as number) ?? 5;
    const ridesCount = (profile.rides_count as number) ?? 0;
    const reviewsCount = (profile.review_count as number) ?? 0;

    if (rating >= 4.8) {
      score += 20;
      reasons.push("Autista eccellente");
    } else if (rating >= 4.5) {
      score += 10;
      reasons.push("Șofer verificat");
    }

    if (ridesCount >= 50) {
      score += 10;
      reasons.push("Molto attivo");
    }

    if (reviewsCount >= 20) {
      score += 5;
      reasons.push("Ben recensito");
    }

    // Boost for same city preference
    if (features?.preferredFromCities?.includes(profile.from_city as string)) {
      score += 15;
      reasons.push("Dalla tua zona");
    }

    return {
      id: `user:${profile.id}`,
      type: "user" as const,
      score: Math.min(100, score),
      reason: reasons.join(", ") || "Autista consigliato",
      data: profile,
      freshUntil: new Date(Date.now() + 86400000).toISOString(),
    };
  });
}

async function getTrendingForFeed(limit: number): Promise<FeedItem[]> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("mv_popular_routes")
    .select("from_city, to_city, ride_count, avg_price, driver_count")
    .limit(limit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((route, index) => ({
    id: `trending:${route.from_city}-${route.to_city}`,
    type: "trending" as const,
    score: Math.max(30, 80 - index * 5),
    reason: "Percorso popolare",
    data: route,
    freshUntil: new Date(Date.now() + 3600000).toISOString(),
  }));
}

async function getNearbyEventsForFeed(limit: number): Promise<FeedItem[]> {
  const supabase = await createServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "active")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((event, index) => ({
    id: `event:${event.id}`,
    type: "event" as const,
    score: Math.max(20, 60 - index * 5),
    reason: "Evento in arrivo",
    data: event,
    freshUntil: `${event.date as string}T23:59:00`,
  }));
}

// ---------------------------------------------------------------------------
// Feed engagement tracking
// ---------------------------------------------------------------------------

export interface FeedInteraction {
  userId: string;
  itemId: string;
  itemType: FeedItemType;
  interaction: "view" | "click" | "book" | "dismiss" | "share";
  timestamp: string;
}

/**
 * Track a feed interaction for model training.
 */
export async function trackFeedInteraction(interaction: FeedInteraction): Promise<void> {
  const supabase = await createServiceRoleClient();

  try {
    await supabase.from("user_actions").insert({
      user_id: interaction.userId,
      action: `feed_${interaction.interaction}`,
      metadata: {
        itemId: interaction.itemId,
        itemType: interaction.itemType,
      },
      created_at: interaction.timestamp,
    });
  } catch {
    // Best-effort tracking
  }
}
