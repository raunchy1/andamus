/**
 * Distributed rate limiting with Upstash Redis.
 * Falls back to Supabase-based rate limiting if Redis is unavailable.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";
import { checkServerRateLimit as supabaseRateLimit } from "./supabase";

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
 * Check rate limit using Upstash Redis with Supabase fallback.
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const windowMs = parseWindow(config.window);
  const ratelimiter = getRatelimiter(config.limit, windowMs);

  if (ratelimiter) {
    try {
      const { success, limit, remaining, reset } = await ratelimiter.limit(config.identifier);
      return { success, limit, remaining, reset };
    } catch (err) {
      console.error("[rate-limit] Redis error, falling back to Supabase:", err instanceof Error ? err.message : err);
    }
  }

  const hours = Math.ceil(windowMs / 3_600_000);
  const { allowed, remaining } = await supabaseRateLimit(
    config.identifier,
    "api",
    config.limit,
    hours
  );

  return {
    success: allowed,
    limit: config.limit,
    remaining: Math.max(0, remaining),
    reset: Date.now() + windowMs,
  };
}

export const rateLimitPresets = {
  strict: { limit: 5, window: "10s" as const },
  standard: { limit: 20, window: "1m" as const },
  generous: { limit: 100, window: "1m" as const },
  webhook: { limit: 100, window: "1m" as const },
  cron: { limit: 10, window: "1h" as const },
};
