/**
 * Cache Key Conventions
 * =====================
 * Structured, predictable cache keys to prevent collisions
 * and enable pattern-based invalidation.
 *
 * Format: namespace:entity:id:variant
 * Examples:
 *   - ride:123:detail
 *   - ride:feed:rome:milan:2026-05-24
 *   - user:456:profile
 *   - analytics:daily:2026-05-24
 */

// ---------------------------------------------------------------------------
// Key builders
// ---------------------------------------------------------------------------

export const CacheKeys = {
  // Ride caching
  rideDetail: (rideId: string) => `ride:${rideId}:detail`,
  rideStops: (rideId: string) => `ride:${rideId}:stops`,
  rideSimilar: (rideId: string) => `ride:${rideId}:similar`,
  rideFeed: (params: { origin?: string; destination?: string; date?: string; cursor?: string | null }) => {
    const parts = ["ride:feed"];
    if (params.origin) parts.push(`o:${params.origin}`);
    if (params.destination) parts.push(`d:${params.destination}`);
    if (params.date) parts.push(`dt:${params.date}`);
    if (params.cursor) parts.push(`c:${params.cursor.slice(0, 16)}`);
    return parts.join(":");
  },
  rideSearchResults: (hash: string) => `ride:search:${hash}`,
  todayRides: (limit: number) => `ride:today:${limit}`,
  trendingRoutes: () => "ride:trending:routes",
  popularRoutes: () => "analytics:popular_routes",

  // User caching
  userProfile: (userId: string) => `user:${userId}:profile`,
  userReputation: (userId: string) => `user:${userId}:reputation`,
  userEntitlements: (userId: string) => `user:${userId}:entitlements`,
  userBookings: (userId: string, cursor?: string | null) =>
    cursor ? `user:${userId}:bookings:c:${cursor.slice(0, 16)}` : `user:${userId}:bookings`,
  userNotifications: (userId: string, cursor?: string | null) =>
    cursor ? `user:${userId}:notifications:c:${cursor.slice(0, 16)}` : `user:${userId}:notifications`,
  userUnreadCount: (userId: string) => `user:${userId}:notifications:unread`,
  userStreak: (userId: string) => `user:${userId}:streak`,

  // Driver caching
  driverReviews: (driverId: string, limit = 10) => `driver:${driverId}:reviews:${limit}`,
  driverLeaderboard: () => "driver:leaderboard",

  // Search caching
  searchSuggestions: (query: string) => `search:suggestions:${query.toLowerCase().trim().slice(0, 30)}`,
  searchResults: (queryHash: string) => `search:results:${queryHash}`,

  // Analytics caching
  dailyMetrics: (date: string) => `analytics:daily:${date}`,
  dashboardSummary: () => "analytics:dashboard:summary",
  conversionFunnel: (days: number) => `analytics:funnel:${days}`,
  retentionCohorts: () => "analytics:retention:cohorts",

  // Group/Event caching
  groupDetail: (groupId: string) => `group:${groupId}:detail`,
  groupMembers: (groupId: string) => `group:${groupId}:members`,
  eventDetail: (eventId: string) => `event:${eventId}:detail`,
  upcomingEvents: () => "events:upcoming",

  // Recommendation caching
  recommendations: (userId: string) => `ai:recommendations:${userId}`,
  similarRides: (rideId: string) => `ai:similar:${rideId}`,

  // Moderation caching
  moderationQueue: (status: string) => `moderation:queue:${status}`,
  reportedUser: (userId: string) => `moderation:reports:${userId}`,

  // System
  featureFlags: () => "system:features",
  appConfig: () => "system:config",
  healthCheck: (service: string) => `health:${service}`,
} as const;

// ---------------------------------------------------------------------------
// Tag-based invalidation keys
// ---------------------------------------------------------------------------

export const CacheTags = {
  ride: (rideId: string) => `tag:ride:${rideId}`,
  user: (userId: string) => `tag:user:${userId}`,
  driver: (driverId: string) => `tag:driver:${driverId}`,
  allRides: () => "tag:rides:all",
  allUsers: () => "tag:users:all",
  allAnalytics: () => "tag:analytics:all",
  allGroups: () => "tag:groups:all",
  allEvents: () => "tag:events:all",
  searchIndex: () => "tag:search:all",
  notifications: (userId: string) => `tag:notifications:${userId}`,
} as const;

// ---------------------------------------------------------------------------
// TTL constants (seconds)
// ---------------------------------------------------------------------------

export const CacheTTL = {
  // Short-lived: data changes frequently
  rideDetail: 60,
  rideFeed: 30,
  userProfile: 120,
  notifications: 30,
  unreadCount: 15,
  searchResults: 45,

  // Medium-lived: semi-static data
  userReputation: 300,
  userEntitlements: 300,
  driverReviews: 180,
  recommendations: 300,
  trendingRoutes: 600,

  // Long-lived: rarely changes
  popularRoutes: 900,
  dailyMetrics: 1800,
  dashboardSummary: 600,
  conversionFunnel: 3600,
  retentionCohorts: 3600,
  groupDetail: 300,
  eventDetail: 300,
  upcomingEvents: 600,
  driverLeaderboard: 1800,
  searchSuggestions: 600,
  featureFlags: 300,
  appConfig: 600,

  // Stale-while-revalidate: serve stale for this long while revalidating
  swrGracePeriod: 60,
} as const;

// ---------------------------------------------------------------------------
// Hash helper for cache keys from complex objects
// ---------------------------------------------------------------------------

export function hashKey(obj: Record<string, unknown>): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
