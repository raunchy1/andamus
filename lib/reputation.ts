/**
 * Reputation & trust score utilities.
 * Pure functions — safe to use on client or server.
 */

export interface ReputationProfile {
  rating: number | null;
  review_count: number | null;
  rides_count: number | null;
  completed_rides_count: number | null;
  created_at?: string | null;
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  id_verified?: boolean | null;
  driver_verified?: boolean | null;
}

/**
 * Compute a trust score (0-100) from profile metrics.
 * Higher = more trustworthy.
 */
export function computeTrustScore(profile: Partial<ReputationProfile>): number {
  let score = 0;

  // Base: account age (max 15 pts)
  if (profile.created_at) {
    const daysSince =
      (Date.now() - new Date(profile.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    score += Math.min(15, daysSince / 7); // 1 pt per week, max 15
  }

  // Reviews (max 25 pts)
  const reviewCount = profile.review_count || 0;
  const rating = profile.rating || 5.0;
  score += Math.min(20, reviewCount * 4); // 4 pts per review, max 20
  score += Math.min(5, (rating - 3) * 2.5); // bonus for high rating, max 5

  // Ride activity (max 25 pts)
  const published = profile.rides_count || 0;
  const completed = profile.completed_rides_count || 0;
  score += Math.min(15, published * 3); // 3 pts per published ride, max 15
  score += Math.min(10, completed * 2); // 2 pts per completed ride, max 10

  // Verifications (max 20 pts)
  if (profile.email_verified) score += 5;
  if (profile.phone_verified) score += 5;
  if (profile.id_verified) score += 5;
  if (profile.driver_verified) score += 5;

  // Review diversity bonus (max 15 pts)
  if (reviewCount >= 5) score += 10;
  else if (reviewCount >= 1) score += 5;
  if (published >= 3 && completed >= 3) score += 5;

  return Math.min(100, Math.round(score));
}

/**
 * Get a human-readable trust level label.
 */
export function getTrustLevel(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 80)
    return { label: "Molto affidabile", color: "text-emerald-400", emoji: "🛡️" };
  if (score >= 60)
    return { label: "Affidabile", color: "text-green-400", emoji: "✅" };
  if (score >= 40)
    return { label: "Nuovo", color: "text-yellow-400", emoji: "🌱" };
  if (score >= 20)
    return { label: "Alle prime armi", color: "text-orange-400", emoji: "👋" };
  return { label: "Appena arrivato", color: "text-white/50", emoji: "👶" };
}

/**
 * Format account age as a human-readable string (Italian).
 */
export function formatAccountAge(
  createdAt: string | null | undefined
): string {
  if (!createdAt) return "Appena arrivato";
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 1) return "Oggi";
  if (days === 1) return "Ieri";
  if (days < 7) return `${days} giorni`;
  if (days < 30) return `${Math.floor(days / 7)} settimane`;
  if (days < 365) return `${Math.floor(days / 30)} mesi`;
  return `${Math.floor(days / 365)} anni`;
}

/**
 * Check if a user is "established" (has enough history to be trusted).
 */
export function isEstablishedUser(profile: Partial<ReputationProfile>): boolean {
  return computeTrustScore(profile) >= 50;
}
