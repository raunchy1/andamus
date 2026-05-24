import { computeTrustScore } from "./reputation";

export interface RankableDriver {
  id: string;
  name: string;
  slug: string | null;
  avatar_url: string | null;
  rating: number;
  review_count: number;
  rides_count: number;
  completed_rides_count: number;
  created_at: string;
  last_active_at: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  id_verified: boolean;
  driver_verified: boolean;
  level: string;
  points: number;
  car_model: string | null;
  city?: string | null;
}

export interface DriverRank {
  driver: RankableDriver;
  score: number;
  tier: "elite" | "gold" | "silver" | "bronze";
  badges: string[];
}

const WEIGHTS = {
  trustScore: 0.25,
  rating: 0.20,
  completedRides: 0.20,
  reviews: 0.10,
  verifications: 0.10,
  accountAge: 0.05,
  recentActivity: 0.10,
};

export function rankDrivers(drivers: RankableDriver[]): DriverRank[] {
  const now = Date.now();

  const ranked = drivers.map((driver) => {
    const trustScore = computeTrustScore(driver);

    // Normalize each factor to 0-100
    const trustNormalized = trustScore; // already 0-100
    const ratingNormalized = (driver.rating / 5) * 100;
    const ridesNormalized = Math.min((driver.completed_rides_count / 50) * 100, 100);
    const reviewsNormalized = Math.min((driver.review_count / 20) * 100, 100);
    const verificationsNormalized =
      [driver.email_verified, driver.phone_verified, driver.id_verified, driver.driver_verified]
        .filter(Boolean).length * 25;

    const accountAgeDays = Math.floor(
      (now - new Date(driver.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const accountAgeNormalized = Math.min((accountAgeDays / 90) * 100, 100);

    const lastActive = driver.last_active_at
      ? new Date(driver.last_active_at).getTime()
      : new Date(driver.created_at).getTime();
    const daysSinceActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
    const recentActivityNormalized = Math.max(0, 100 - daysSinceActive * 5);

    const score = Math.round(
      trustNormalized * WEIGHTS.trustScore +
      ratingNormalized * WEIGHTS.rating +
      ridesNormalized * WEIGHTS.completedRides +
      reviewsNormalized * WEIGHTS.reviews +
      verificationsNormalized * WEIGHTS.verifications +
      accountAgeNormalized * WEIGHTS.accountAge +
      recentActivityNormalized * WEIGHTS.recentActivity
    );

    // Determine tier
    let tier: DriverRank["tier"] = "bronze";
    if (score >= 85) tier = "elite";
    else if (score >= 70) tier = "gold";
    else if (score >= 55) tier = "silver";

    // Build badges
    const badges: string[] = [];
    if (driver.completed_rides_count >= 100) badges.push("100_rides");
    else if (driver.completed_rides_count >= 50) badges.push("50_rides");
    else if (driver.completed_rides_count >= 10) badges.push("10_rides");

    if (driver.rating >= 4.8 && driver.review_count >= 5) badges.push("top_rated");
    if (driver.driver_verified && driver.id_verified) badges.push("fully_verified");
    if (driver.review_count >= 20) badges.push("community_favorite");
    if (recentActivityNormalized >= 90) badges.push("active_now");

    return { driver, score, tier, badges };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

export function filterDrivers(
  ranked: DriverRank[],
  filters: {
    city?: string;
    minRating?: number;
    verifiedOnly?: boolean;
    minRides?: number;
    searchQuery?: string;
  }
): DriverRank[] {
  return ranked.filter((r) => {
    if (filters.city && r.driver.city !== filters.city) return false;
    if (filters.minRating && r.driver.rating < filters.minRating) return false;
    if (filters.verifiedOnly && !r.driver.driver_verified) return false;
    if (filters.minRides && r.driver.completed_rides_count < filters.minRides) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        r.driver.name.toLowerCase().includes(q) ||
        r.driver.city?.toLowerCase().includes(q) ||
        r.driver.car_model?.toLowerCase().includes(q) ||
        r.driver.slug?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}
