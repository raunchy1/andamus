import "server-only";

/**
 * Behavioral Ranking Engine
 * =========================
 * Rides content based on predicted user engagement and conversion.
 * WHY: Even with good recommendations, the order matters. A ranking model
 * that considers CTR, conversion probability, and diversity improves outcomes.
 */

import type { UserFeatures } from "@/lib/server/ai/embeddings";

// ---------------------------------------------------------------------------
// Ranking factors
// ---------------------------------------------------------------------------

export interface RankingFactors {
  // Relevance
  routeMatch: number;        // 0-1, how well route matches user history
  timeProximity: number;     // 0-1, how close to user's preferred time
  priceAttractiveness: number; // 0-1, relative to user's avg booking value

  // Quality
  driverTrust: number;       // 0-1, driver reputation
  driverExperience: number;  // 0-1, based on ride count
  recency: number;           // 0-1, how recently the ride was posted

  // Social
  socialProof: number;       // 0-1, bookings / seats ratio
  friendActivity: number;    // 0-1, friends who booked or drive

  // Business
  platformPriority: number;  // 0-1, boosted rides, premium drivers
  urgency: number;           // 0-1, time until departure
}

export interface RankableItem {
  id: string;
  type: string;
  factors: RankingFactors;
  rawScore: number; // Base relevance score
}

export interface RankedItem {
  id: string;
  type: string;
  score: number;
  factors: RankingFactors;
  explanation: string;
  rank: number;
}

// ---------------------------------------------------------------------------
// Factor weights (can be A/B tested)
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS = {
  routeMatch: 0.20,
  timeProximity: 0.15,
  priceAttractiveness: 0.10,
  driverTrust: 0.15,
  driverExperience: 0.05,
  recency: 0.10,
  socialProof: 0.10,
  friendActivity: 0.05,
  platformPriority: 0.05,
  urgency: 0.05,
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function computeWeightedScore(factors: RankingFactors, weights = DEFAULT_WEIGHTS): number {
  let score = 0;
  score += factors.routeMatch * weights.routeMatch;
  score += factors.timeProximity * weights.timeProximity;
  score += factors.priceAttractiveness * weights.priceAttractiveness;
  score += factors.driverTrust * weights.driverTrust;
  score += factors.driverExperience * weights.driverExperience;
  score += factors.recency * weights.recency;
  score += factors.socialProof * weights.socialProof;
  score += factors.friendActivity * weights.friendActivity;
  score += factors.platformPriority * weights.platformPriority;
  score += factors.urgency * weights.urgency;

  return Math.min(1, Math.max(0, score));
}

function generateExplanation(factors: RankingFactors, weights = DEFAULT_WEIGHTS): string {
  const explanations: string[] = [];

  if (factors.routeMatch > 0.7) explanations.push("percorso preferito");
  if (factors.driverTrust > 0.8) explanations.push("autista affidabile");
  if (factors.timeProximity > 0.7) explanations.push("orario adatto");
  if (factors.priceAttractiveness > 0.7) explanations.push("ottimo prezzo");
  if (factors.urgency > 0.8) explanations.push("partenza imminente");
  if (factors.socialProof > 0.5) explanations.push("richiesta da altri");
  if (factors.platformPriority > 0.5) explanations.push("in evidenza");

  if (explanations.length === 0) {
    return "consigliato per te";
  }

  return explanations.join(", ");
}

// ---------------------------------------------------------------------------
// Ranking with diversity
// ---------------------------------------------------------------------------

/**
 * Rank items using weighted scoring with diversity re-ranking.
 * Ensures users don't see 10 rides from the same driver/route.
 */
export function rankItems(
  items: RankableItem[],
  options?: {
    userFeatures?: UserFeatures | null;
    maxPerDriver?: number;
    maxPerRoute?: number;
    diversityBoost?: number;
  }
): RankedItem[] {
  const maxPerDriver = options?.maxPerDriver ?? 3;
  const maxPerRoute = options?.maxPerRoute ?? 3;
  const diversityBoost = options?.diversityBoost ?? 0.05;

  // Initial scoring
  let scored = items.map((item) => ({
    ...item,
    weightedScore: computeWeightedScore(item.factors),
  }));

  // Sort by initial score
  scored.sort((a, b) => b.weightedScore - a.weightedScore);

  // Diversity re-ranking
  const result: RankedItem[] = [];
  const driverCounts = new Map<string, number>();
  const routeCounts = new Map<string, number>();

  for (const item of scored) {
    // Extract driver/route info from item data (simplified)
    const driverId = (item.rawScore as unknown as Record<string, string>)?.driver_id ?? "unknown";
    const routeKey = `${(item.rawScore as unknown as Record<string, string>)?.from_city}-${(item.rawScore as unknown as Record<string, string>)?.to_city}`;

    const driverCount = driverCounts.get(driverId) ?? 0;
    const routeCount = routeCounts.get(routeKey) ?? 0;

    let diversityPenalty = 0;
    if (driverCount >= maxPerDriver) diversityPenalty += 0.3;
    if (routeCount >= maxPerRoute) diversityPenalty += 0.2;

    const adjustedScore = item.weightedScore - diversityPenalty;

    // Only include if score is still reasonable
    if (adjustedScore > 0.1) {
      driverCounts.set(driverId, driverCount + 1);
      routeCounts.set(routeKey, routeCount + 1);

      result.push({
        id: item.id,
        type: item.type,
        score: adjustedScore,
        factors: item.factors,
        explanation: generateExplanation(item.factors),
        rank: 0, // Will be set after final sort
      });
    }
  }

  // Final sort by adjusted score
  result.sort((a, b) => b.score - a.score);

  // Assign ranks
  result.forEach((item, index) => {
    item.rank = index + 1;
  });

  return result;
}

// ---------------------------------------------------------------------------
// Ride-specific ranking factors
// ---------------------------------------------------------------------------

export interface RideForRanking {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  booked_count?: number;
  created_at: string;
  profiles?: {
    rating?: number;
    review_count?: number;
    rides_count?: number;
    trust_score?: number;
  };
}

/**
 * Compute ranking factors for a ride given user features.
 */
export function computeRideRankingFactors(
  ride: RideForRanking,
  userFeatures: UserFeatures | null
): RankingFactors {
  const now = new Date();
  const rideDate = new Date(`${ride.date}T${ride.time}`);
  const hoursUntil = Math.max(0, (rideDate.getTime() - now.getTime()) / 3600000);

  // Route match
  const routeMatch = userFeatures
    ? (userFeatures.preferredFromCities.includes(ride.from_city) ? 0.5 : 0) +
      (userFeatures.preferredToCities.includes(ride.to_city) ? 0.5 : 0)
    : 0.3;

  // Time proximity
  const preferredHour = userFeatures?.preferredTimeWindow === "morning" ? 8 :
    userFeatures?.preferredTimeWindow === "afternoon" ? 14 :
    userFeatures?.preferredTimeWindow === "evening" ? 19 : 12;
  const rideHour = parseInt(ride.time.split(":")[0], 10);
  const timeProximity = Math.max(0, 1 - Math.abs(rideHour - preferredHour) / 12);

  // Price attractiveness
  const avgValue = userFeatures?.avgBookingValue ?? 20;
  const priceAttractiveness = ride.price <= avgValue ? 1 :
    Math.max(0, 1 - (ride.price - avgValue) / avgValue);

  // Driver trust
  const driverTrust = (ride.profiles?.trust_score ?? 50) / 100;

  // Driver experience
  const driverExperience = Math.min(1, (ride.profiles?.rides_count ?? 0) / 50);

  // Recency
  const rideAgeHours = Math.max(0, (now.getTime() - new Date(ride.created_at).getTime()) / 3600000);
  const recency = Math.max(0, 1 - rideAgeHours / 168); // Decay over 1 week

  // Social proof
  const booked = ride.booked_count ?? 0;
  const socialProof = ride.seats > 0 ? Math.min(1, booked / ride.seats) : 0;

  // Friend activity (placeholder — would need social graph)
  const friendActivity = 0;

  // Platform priority
  const platformPriority = 0; // Would be set for boosted rides

  // Urgency
  const urgency = Math.min(1, 24 / Math.max(hoursUntil, 1));

  return {
    routeMatch,
    timeProximity,
    priceAttractiveness,
    driverTrust,
    driverExperience,
    recency,
    socialProof,
    friendActivity,
    platformPriority,
    urgency,
  };
}

// ---------------------------------------------------------------------------
// A/B test weight configuration
// ---------------------------------------------------------------------------

export type WeightVariant = "control" | "trust_focused" | "price_focused" | "social_focused";

const VARIANT_WEIGHTS: Record<WeightVariant, typeof DEFAULT_WEIGHTS> = {
  control: DEFAULT_WEIGHTS,
  trust_focused: {
    ...DEFAULT_WEIGHTS,
    driverTrust: 0.25,
    driverExperience: 0.10,
    routeMatch: 0.15,
  },
  price_focused: {
    ...DEFAULT_WEIGHTS,
    priceAttractiveness: 0.20,
    routeMatch: 0.15,
    driverTrust: 0.10,
  },
  social_focused: {
    ...DEFAULT_WEIGHTS,
    socialProof: 0.20,
    friendActivity: 0.10,
    routeMatch: 0.15,
  },
};

export function getWeightsForVariant(variant: WeightVariant): typeof DEFAULT_WEIGHTS {
  return VARIANT_WEIGHTS[variant] ?? DEFAULT_WEIGHTS;
}
