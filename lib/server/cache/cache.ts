import "server-only";

/**
 * Advanced Caching Layer
 * ======================
 * Redis-backed cache with stale-while-revalidate, tag-based invalidation,
 * and fallback-safe behavior.
 *
 * WHY: At 100K+ users, every redundant DB query is wasted capacity.
 * SWR lets us serve slightly stale data instantly while revalidating
 * in the background — perfect for mobile latency requirements.
 */

import { getRedis } from "@/lib/redis";
import type { CacheTTL as CacheTTLType } from "./keys";
import { CacheTTL } from "./keys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  staleAt: number;
  expiresAt: number;
  tags: string[];
  version: number;
}

export interface CacheOptions {
  ttlSeconds?: number;
  swrSeconds?: number;
  tags?: string[];
  version?: number;
  skipCache?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  errors: number;
  backgroundRefreshes: number;
}

// ---------------------------------------------------------------------------
// In-memory fallback (per-request / per-process)
// ---------------------------------------------------------------------------

const _memoryCache = new Map<string, CacheEntry<unknown>>();
const _stats: CacheStats = {
  hits: 0,
  misses: 0,
  staleHits: 0,
  errors: 0,
  backgroundRefreshes: 0,
};

function getMemoryEntry<T>(key: string): CacheEntry<T> | undefined {
  const entry = _memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    _memoryCache.delete(key);
    return undefined;
  }
  return entry;
}

function setMemoryEntry<T>(key: string, entry: CacheEntry<T>): void {
  // Memory cache cap to prevent unbounded growth
  if (_memoryCache.size > 5000) {
    // Evict oldest 10%
    const entries = Array.from(_memoryCache.entries());
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const toEvict = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toEvict; i++) {
      _memoryCache.delete(entries[i][0]);
    }
  }
  _memoryCache.set(key, entry as CacheEntry<unknown>);
}

// ---------------------------------------------------------------------------
// Core cache operations
// ---------------------------------------------------------------------------

/**
 * Get a value from cache. Returns null if not found or expired.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // 1. Check memory cache first (fastest)
  const memEntry = getMemoryEntry<T>(key);
  if (memEntry) {
    _stats.hits++;
    return memEntry.value;
  }

  // 2. Check Redis
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (!raw) return null;

    const entry = JSON.parse(raw as string) as CacheEntry<T>;

    // Hard expired
    if (Date.now() > entry.expiresAt) {
      await redis.del(key);
      return null;
    }

    // Populate memory cache
    setMemoryEntry(key, entry);
    _stats.hits++;
    return entry.value;
  } catch {
    _stats.errors++;
    return null;
  }
}

/**
 * Store a value in cache with TTL and optional tags.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const ttl = (options.ttlSeconds ?? CacheTTL.rideDetail) * 1000;
  const swr = (options.swrSeconds ?? CacheTTL.swrGracePeriod) * 1000;
  const now = Date.now();

  const entry: CacheEntry<T> = {
    value,
    cachedAt: now,
    staleAt: now + ttl,
    expiresAt: now + ttl + swr,
    tags: options.tags ?? [],
    version: options.version ?? 1,
  };

  // Update memory cache
  setMemoryEntry(key, entry);

  // Update Redis
  const redis = getRedis();
  if (!redis) return;

  try {
    const serialized = JSON.stringify(entry);
    // Store with TTL = stale period + grace period
    const totalTtlSeconds = Math.ceil((ttl + swr) / 1000);
    await redis.setex(key, totalTtlSeconds, serialized);

    // Index by tags for invalidation
    if (entry.tags.length > 0) {
      for (const tag of entry.tags) {
        await redis.sadd(`_tags:${tag}`, key);
        await redis.expire(`_tags:${tag}`, totalTtlSeconds * 2);
      }
    }
  } catch (err) {
    console.error("[cache] cacheSet error:", err);
    _stats.errors++;
  }
}

/**
 * Delete a single cache key.
 */
export async function cacheDelete(key: string): Promise<void> {
  _memoryCache.delete(key);
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Silent fail
  }
}

/**
 * Invalidate all cache entries with a given tag.
 */
export async function cacheInvalidateTag(tag: string): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    // Fallback: scan memory cache
    let count = 0;
    for (const [key, entry] of _memoryCache.entries()) {
      if (entry.tags.includes(tag)) {
        _memoryCache.delete(key);
        count++;
      }
    }
    return count;
  }

  try {
    const keys = await redis.smembers(`_tags:${tag}`);
    if (!keys || keys.length === 0) return 0;

    // Delete all tagged keys
    const pipeline = redis.pipeline();
    for (const k of keys) {
      pipeline.del(k as string);
    }
    // Delete the tag index itself
    pipeline.del(`_tags:${tag}`);
    await pipeline.exec();

    // Also clear from memory
    for (const k of keys) {
      _memoryCache.delete(k as string);
    }

    return keys.length;
  } catch {
    return 0;
  }
}

/**
 * Invalidate multiple tags at once.
 */
export async function cacheInvalidateTags(tags: string[]): Promise<number> {
  let total = 0;
  for (const tag of tags) {
    total += await cacheInvalidateTag(tag);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Stale-while-revalidate pattern
// ---------------------------------------------------------------------------

export interface SwrResult<T> {
  data: T;
  fromCache: boolean;
  isStale: boolean;
  revalidated: boolean;
}

/**
 * Get with stale-while-revalidate pattern.
 *
 * 1. Return fresh cache immediately
 * 2. If stale but not expired, return stale + trigger background revalidation
 * 3. If expired or missing, fetch and cache
 *
 * This is the PRIMARY caching API for read-heavy data.
 */
export async function cacheGetSwr<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<SwrResult<T>> {
  if (options.skipCache) {
    const data = await fetcher();
    return { data, fromCache: false, isStale: false, revalidated: false };
  }

  const now = Date.now();

  // Try memory first
  const memEntry = getMemoryEntry<T>(key);
  if (memEntry) {
    const isStale = now > memEntry.staleAt;

    if (!isStale) {
      _stats.hits++;
      return { data: memEntry.value, fromCache: true, isStale: false, revalidated: false };
    }

    // Stale but within grace period — return immediately + revalidate in background
    _stats.staleHits++;

    // Fire-and-forget background revalidation
    setTimeout(() => {
      cacheRevalidate(key, fetcher, options).catch(() => {
        // Background revalidation failures are non-critical
      });
    }, 0);

    return { data: memEntry.value, fromCache: true, isStale: true, revalidated: false };
  }

  // Try Redis
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) {
        const entry = JSON.parse(raw as string) as CacheEntry<T>;

        if (now <= entry.expiresAt) {
          setMemoryEntry(key, entry);
          const isStale = now > entry.staleAt;

          if (!isStale) {
            _stats.hits++;
            return { data: entry.value, fromCache: true, isStale: false, revalidated: false };
          }

          // Stale hit — trigger background revalidation
          _stats.staleHits++;
          setTimeout(() => {
            cacheRevalidate(key, fetcher, options).catch(() => {});
          }, 0);

          return { data: entry.value, fromCache: true, isStale: true, revalidated: false };
        }
      }
    } catch {
      // Fall through to fetch
    }
  }

  // Cache miss — fetch and store
  _stats.misses++;
  const data = await fetcher();
  await cacheSet(key, data, options);
  return { data, fromCache: false, isStale: false, revalidated: true };
}

/**
 * Background revalidation — fetch fresh data and update cache.
 */
async function cacheRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<void> {
  try {
    const data = await fetcher();
    await cacheSet(key, data, options);
    _stats.backgroundRefreshes++;
  } catch (err) {
    console.warn(`[cache] Background revalidation failed for ${key}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Multi-get for batch operations
// ---------------------------------------------------------------------------

/**
 * Fetch multiple cached values in a single Redis round-trip.
 * Missing keys are returned as null.
 */
export async function cacheMget<T>(keys: string[]): Promise<Map<string, T | null>> {
  const results = new Map<string, T | null>();

  // First check memory
  const redisKeys: string[] = [];
  for (const key of keys) {
    const mem = getMemoryEntry<T>(key);
    if (mem) {
      results.set(key, mem.value);
    } else {
      redisKeys.push(key);
      results.set(key, null);
    }
  }

  if (redisKeys.length === 0) return results;

  const redis = getRedis();
  if (!redis) return results;

  try {
    const vals = await redis.mget(...redisKeys);
    for (let i = 0; i < redisKeys.length; i++) {
      const key = redisKeys[i];
      const val = vals[i];
      if (val) {
        try {
          const entry = JSON.parse(val as string) as CacheEntry<T>;
          if (Date.now() <= entry.expiresAt) {
            setMemoryEntry(key, entry);
            results.set(key, entry.value);
          }
        } catch {
          // Invalid entry
        }
      }
    }
  } catch {
    // Silent fail
  }

  return results;
}

// ---------------------------------------------------------------------------
// Cache warming
// ---------------------------------------------------------------------------

/**
 * Pre-populate cache with computed values.
 * Use after deploys or data imports to prevent cold-start latency.
 */
export async function cacheWarm<T>(
  entries: Array<{ key: string; value: T; options?: CacheOptions }>
): Promise<{ warmed: number; failed: number }> {
  let warmed = 0;
  let failed = 0;

  for (const { key, value, options } of entries) {
    try {
      await cacheSet(key, value, options);
      warmed++;
    } catch {
      failed++;
    }
  }

  return { warmed, failed };
}

// ---------------------------------------------------------------------------
// Stats and health
// ---------------------------------------------------------------------------

export function getCacheStats(): CacheStats {
  return { ..._stats };
}

export function resetCacheStats(): void {
  _stats.hits = 0;
  _stats.misses = 0;
  _stats.staleHits = 0;
  _stats.errors = 0;
  _stats.backgroundRefreshes = 0;
}

export interface CacheHealth {
  redisConnected: boolean;
  memoryEntries: number;
  memoryBytesEstimate: number;
  hitRate: number;
}

export async function getCacheHealth(): Promise<CacheHealth> {
  const redis = getRedis();
  let redisConnected = false;

  if (redis) {
    try {
      redisConnected = (await redis.ping()) === "PONG";
    } catch {
      redisConnected = false;
    }
  }

  const total = _stats.hits + _stats.misses + _stats.staleHits;
  const hitRate = total > 0 ? (_stats.hits + _stats.staleHits) / total : 0;

  // Rough memory estimate
  let memoryBytes = 0;
  for (const entry of _memoryCache.values()) {
    memoryBytes += JSON.stringify(entry).length * 2; // UTF-16 rough estimate
  }

  return {
    redisConnected,
    memoryEntries: _memoryCache.size,
    memoryBytesEstimate: memoryBytes,
    hitRate,
  };
}

// ---------------------------------------------------------------------------
// Convenience exports for common TTL presets
// ---------------------------------------------------------------------------

export { CacheTTL };
export type { CacheTTLType };
