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
  // Phone verification was removed: it required a paid SMS provider and never
  // worked in production. Its 5 points are redistributed across the remaining
  // three so the block still tops out at 20 and the trust bands don't shift.
  if (profile.email_verified) score += 6;
  if (profile.id_verified) score += 7;
  if (profile.driver_verified) score += 7;

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
  /** Dictionary key under the `reputation.trust` namespace, not display text. */
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 80)
    return { label: "veryReliable", color: "text-emerald-600", emoji: "" };
  if (score >= 60)
    return { label: "reliable", color: "text-accent", emoji: "" };
  if (score >= 40)
    return { label: "growing", color: "text-pending", emoji: "" };
  if (score >= 20)
    return { label: "newMember", color: "text-accent", emoji: "" };
  return { label: "newProfile", color: "text-faint", emoji: "" };
}

/**
 * Account age as a unit + count, for the caller to render through the
 * dictionary. Returning a formatted Italian string here made every consumer
 * locale-blind.
 */
export function getAccountAge(
  createdAt: string | null | undefined
): { unit: "justArrived" | "today" | "yesterday" | "days" | "weeks" | "months" | "years"; count: number } {
  if (!createdAt) return { unit: "justArrived", count: 0 };
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 1) return { unit: "today", count: 0 };
  if (days === 1) return { unit: "yesterday", count: 1 };
  if (days < 7) return { unit: "days", count: days };
  if (days < 30) return { unit: "weeks", count: Math.floor(days / 7) };
  if (days < 365) return { unit: "months", count: Math.floor(days / 30) };
  return { unit: "years", count: Math.floor(days / 365) };
}

/**
 * Check if a user is "established" (has enough history to be trusted).
 */
export function isEstablishedUser(profile: Partial<ReputationProfile>): boolean {
  return computeTrustScore(profile) >= 50;
}

/**
 * Calculate completion rate percentage.
 */
export function getCompletionRate(completed: number | null, total: number | null): number | null {
  const comp = completed || 0;
  const tot = total || 0;
  // No completed rides yet means there is no rate to report. Returning a
  // default of 100% would state a track record the user has not earned.
  if (tot === 0) return null;
  return Math.min(100, Math.round((comp / tot) * 100));
}
