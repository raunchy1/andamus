/**
 * Upstash Redis client for distributed rate limiting, caching, and sessions.
 * Falls back to no-op if UPSTASH_REDIS_REST_URL is not configured.
 */

import { Redis } from "@upstash/redis";
import { env } from "@/lib/server/validators/env";

let _redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;

  try {
    const e = env();
    if (!e.UPSTASH_REDIS_REST_URL || !e.UPSTASH_REDIS_REST_TOKEN) {
      console.warn("[redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting will use in-memory fallback.");
      _redis = null;
      return _redis;
    }

    _redis = new Redis({
      url: e.UPSTASH_REDIS_REST_URL,
      token: e.UPSTASH_REDIS_REST_TOKEN,
    });
    return _redis;
  } catch {
    _redis = null;
    return _redis;
  }
}

export async function redisPing(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
