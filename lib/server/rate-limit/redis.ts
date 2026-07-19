/**
 * Distributed rate limiting with Upstash Redis.
 * Falls back to an in-memory fixed-window limiter if Redis is unavailable.
 * (Per-serverless-instance, best-effort — configure Upstash for strict limits.)
 */

import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";

export type RateLimitConfig = {
  identifier: string;
  limit: number;
  window: "1s" | "10s" | "1m" | "5m" | "10m" | "1h" | "6h" | "12h" | "24h";
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
};

const _ratelimitCache = new Map<string, Ratelimit>();

function getRatelimiter(limit: number, windowMs: number): Ratelimit | null {
  const key = `${limit}:${windowMs}`;
  if (_ratelimitCache.has(key)) return _ratelimitCache.get(key)!;

  const redis = getRedis();
  if (!redis) return null;

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
    analytics: true,
  });

  _ratelimitCache.set(key, ratelimit);
  return ratelimit;
}

function parseWindow(window: RateLimitConfig["window"]): number {
  switch (window) {
    case "1s": return 1_000;
    case "10s": return 10_000;
    case "1m": return 60_000;
    case "5m": return 300_000;
    case "10m": return 600_000;
    case "1h": return 3_600_000;
    case "6h": return 21_600_000;
    case "12h": return 43_200_000;
    case "24h": return 86_400_000;
  }
}

/**
 * In-memory fixed-window fallback limiter.
 * Works with any string identifier (e.g. `rl:ip:<ip>`), honors the real
 * window in milliseconds, and never touches the database — the previous
 * Supabase fallback wrote IP keys into the UUID `user_actions.user_id`
 * column and fail-closed every request with a 429.
 */
const _fallbackBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Bound memory usage: lazily drop expired buckets when the map grows.
  if (_fallbackBuckets.size > 5000) {
    for (const [key, bucket] of _fallbackBuckets) {
      if (bucket.resetAt <= now) _fallbackBuckets.delete(key);
    }
  }

  const bucket = _fallbackBuckets.get(identifier);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    _fallbackBuckets.set(identifier, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  bucket.count += 1;
  return {
    success: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.resetAt,
  };
}

/**
 * Check rate limit using Upstash Redis with in-memory fallback.
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const windowMs = parseWindow(config.window);
  const ratelimiter = getRatelimiter(config.limit, windowMs);

  if (ratelimiter) {
    try {
      const { success, limit, remaining, reset } = await ratelimiter.limit(config.identifier);
      return { success, limit, remaining, reset };
    } catch (err) {
      console.error("[rate-limit] Redis error, falling back to in-memory:", err instanceof Error ? err.message : err);
    }
  }

  try {
    return checkRateLimitInMemory(config.identifier, config.limit, windowMs);
  } catch (err) {
    // Rate limiting must never block legitimate traffic (e.g. OAuth login).
    console.error("[rate-limit] In-memory fallback error, allowing request:", err instanceof Error ? err.message : err);
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Date.now() + windowMs,
    };
  }
}

export const rateLimitPresets = {
  strict: { limit: 5, window: "10s" as const },
  standard: { limit: 20, window: "1m" as const },
  generous: { limit: 100, window: "1m" as const },
  webhook: { limit: 100, window: "1m" as const },
  cron: { limit: 10, window: "1h" as const },
};
