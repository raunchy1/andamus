// @ts-nocheck
"use server";

/**
 * Query Optimizer
 * ===============
 * Prevents N+1 queries, implements efficient batch loading (DataLoader pattern),
 * and provides query builders for common patterns.
 *
 * WHY: At 100K+ users, N+1 queries become the primary scalability bottleneck.
 * Batch loading reduces O(N) round-trips to O(1).
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatchedQuery<T> {
  keys: string[];
  results: Map<string, T | null>;
}

export interface QueryPlan {
  table: string;
  select: string;
  filters: Array<{ column: string; operator: string; value: unknown }>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// DataLoader-style batch loader
// ---------------------------------------------------------------------------

/**
 * Batch load rows by primary key with a single query.
 * Returns a Map for O(1) lookup by the original key.
 */
export async function batchLoadById<T extends { id: string }>(
  table: string,
  ids: string[],
  select = "*",
  options?: { useServiceRole?: boolean; filterColumn?: string }
): Promise<Map<string, T>> {
  if (ids.length === 0) return new Map();

  // Deduplicate while preserving order for cache key stability
  const uniqueIds = [...new Set(ids)];
  const column = options?.filterColumn ?? "id";

  const supabase = options?.useServiceRole
    ? await createServiceRoleClient()
    : await createClient();

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .in(column, uniqueIds);

  if (error) {
    console.error(`[query-optimizer] batchLoadById(${table}) error:`, error.message);
    return new Map();
  }

  const results = new Map<string, T>();
  for (const row of (data ?? []) as T[]) {
    const key = (row as Record<string, unknown>)[column] as string;
    if (key) results.set(key, row);
  }
  return results;
}

/**
 * Batch load related rows for a set of parent IDs.
 * e.g. Load all stops for a set of ride IDs.
 */
export async function batchLoadRelated<T extends Record<string, unknown>>(
  table: string,
  parentIds: string[],
  parentColumn: string,
  select = "*",
  options?: { useServiceRole?: boolean; orderBy?: { column: string; ascending: boolean } }
): Promise<Map<string, T[]>> {
  if (parentIds.length === 0) return new Map();

  const uniqueIds = [...new Set(parentIds)];
  const supabase = options?.useServiceRole
    ? await createServiceRoleClient()
    : await createClient();

  let query = supabase.from(table).select(select).in(parentColumn, uniqueIds);
  if (options?.orderBy) {
    query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[query-optimizer] batchLoadRelated(${table}) error:`, error.message);
    return new Map();
  }

  const groups = new Map<string, T[]>();
  for (const row of (data ?? []) as T[]) {
    const parentId = row[parentColumn] as string;
    if (!groups.has(parentId)) groups.set(parentId, []);
    groups.get(parentId)!.push(row);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Eager loading helpers for common patterns
// ---------------------------------------------------------------------------

export interface RideWithStops {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  status: string;
  stops: Array<{ city: string; order_index: number }>;
}

/**
 * Load rides with their stops in exactly 2 queries (not N+1).
 */
export async function loadRidesWithStops(rideIds: string[]): Promise<RideWithStops[]> {
  if (rideIds.length === 0) return [];

  const supabase = await createClient();

  // Query 1: Load rides
  const { data: rides, error: ridesError } = await supabase
    .from("rides")
    .select("*")
    .in("id", rideIds)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (ridesError || !rides) {
    console.error("[query-optimizer] loadRidesWithStops rides error:", ridesError?.message);
    return [];
  }

  // Query 2: Batch load all stops
  const stopsMap = await batchLoadRelated<{ city: string; order_index: number; ride_id: string }>(
    "ride_stops",
    rideIds,
    "ride_id",
    "city, order_index, ride_id",
    { orderBy: { column: "order_index", ascending: true } }
  );

  return (rides as RideWithStops[]).map((ride) => ({
    ...ride,
    stops: stopsMap.get(ride.id) ?? [],
  }));
}

export interface BookingWithRide {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
  created_at: string;
  ride: {
    id: string;
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
    driver_id: string;
    profiles: { name: string; avatar_url: string | null };
  };
}

/**
 * Load bookings with full ride + driver profile in 2 queries.
 */
export async function loadBookingsWithRides(
  passengerId: string,
  options?: { limit?: number; cursor?: string; direction?: "next" | "prev" }
): Promise<{ bookings: BookingWithRide[]; nextCursor: string | null; prevCursor: string | null }> {
  const supabase = await createClient();
  const limit = Math.min(options?.limit ?? 20, 100);

  // Query 1: Load bookings with cursor pagination
  let query = supabase
    .from("bookings")
    .select("id, ride_id, passenger_id, status, created_at")
    .eq("passenger_id", passengerId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (options?.cursor) {
    if (options.direction === "next") {
      query = query.lt("created_at", options.cursor);
    } else {
      query = query.gt("created_at", options.cursor);
    }
  }

  const { data: bookings, error } = await query;

  if (error || !bookings) {
    console.error("[query-optimizer] loadBookingsWithRides error:", error?.message);
    return { bookings: [], nextCursor: null, prevCursor: null };
  }

  const hasMore = bookings.length > limit;
  const sliced = hasMore ? bookings.slice(0, limit) : bookings;
  const rideIds = [...new Set(sliced.map((b) => b.ride_id).filter(Boolean))];

  if (rideIds.length === 0) {
    return { bookings: [], nextCursor: null, prevCursor: null };
  }

  // Query 2: Batch load rides with driver profiles
  const { data: rides, error: ridesError } = await supabase
    .from("rides")
    .select(`
      id, from_city, to_city, date, time, price, driver_id,
      profiles!inner(name, avatar_url)
    `)
    .in("id", rideIds);

  if (ridesError || !rides) {
    console.error("[query-optimizer] loadBookingsWithRides rides error:", ridesError?.message);
    return { bookings: [], nextCursor: null, prevCursor: null };
  }

  const rideMap = new Map(
    (rides as BookingWithRide["ride"][]).map((r) => [r.id, r])
  );

  const result = sliced.map((b) => ({
    ...(b as unknown as BookingWithRide),
    ride: rideMap.get(b.ride_id) as BookingWithRide["ride"],
  })) as BookingWithRide[];

  return {
    bookings: result,
    nextCursor: hasMore ? sliced[sliced.length - 1].created_at : null,
    prevCursor: options?.cursor ?? null,
  };
}

// ---------------------------------------------------------------------------
// Query deduplication / request coalescing
// ---------------------------------------------------------------------------

const _inFlightQueries = new Map<string, Promise<unknown>>();

/**
 * Coalesce identical in-flight queries to prevent thundering herd.
 * Useful when multiple Server Components render simultaneously
 * and issue the same database query.
 */
export async function coalescedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  options?: { ttlMs?: number }
): Promise<T> {
  const existing = _inFlightQueries.get(cacheKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = queryFn().finally(() => {
    setTimeout(() => _inFlightQueries.delete(cacheKey), options?.ttlMs ?? 100);
  });

  _inFlightQueries.set(cacheKey, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Explain plan helper (for local/dev optimization)
// ---------------------------------------------------------------------------

export async function explainQuery(
  table: string,
  select: string,
  filters: Array<{ column: string; operator: string; value: unknown }>
): Promise<Array<Record<string, unknown>> | null> {
  const supabase = await createServiceRoleClient();

  let query = supabase.from(table).select(select);
  for (const f of filters) {
    switch (f.operator) {
      case "eq":
        query = query.eq(f.column, f.value);
        break;
      case "gt":
        query = query.gt(f.column, f.value);
        break;
      case "lt":
        query = query.lt(f.column, f.value);
        break;
      case "gte":
        query = query.gte(f.column, f.value);
        break;
      case "lte":
        query = query.lte(f.column, f.value);
        break;
      case "in":
        query = query.in(f.column, f.value as string[]);
        break;
    }
  }

  // @ts-expect-error - Supabase supports explain via rpc or raw
  const { data, error } = await query.explain();

  if (error) {
    console.error("[query-optimizer] explainQuery error:", error.message);
    return null;
  }
  return data as Array<Record<string, unknown>> | null;
}
