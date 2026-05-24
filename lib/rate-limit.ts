/**
 * Unified rate limiting entry point.
 * Uses Upstash Redis with sliding window as primary.
 * Falls back to Supabase-based limiting if Redis is unavailable.
 */

export {
  checkRateLimit,
  rateLimitPresets,
} from "@/lib/server/rate-limit/redis";

export type {
  RateLimitConfig,
  RateLimitResult,
} from "@/lib/server/rate-limit/redis";

export { checkServerRateLimit } from "@/lib/server/rate-limit/supabase";
