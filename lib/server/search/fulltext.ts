"use server";

/**
 * Full-Text Search Engine
 * =======================
 * Postgres full-text search with typo tolerance and weighted ranking.
 * WHY: Supabase's built-in text search is powerful but needs proper
 * configuration for multi-language support and ranking.
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  id: string;
  type: "ride" | "user" | "group" | "event";
  rank: number;
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
}

export interface FullTextSearchOptions {
  query: string;
  types?: ("ride" | "user" | "group" | "event")[];
  limit?: number;
  fuzzy?: boolean;
}

// ---------------------------------------------------------------------------
// Query normalization
// ---------------------------------------------------------------------------

function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

function toTsQuery(query: string): string {
  const words = normalizeQuery(query).split(" ").filter(Boolean);
  if (words.length === 0) return "";

  // Prefix matching for autocomplete-like behavior
  return words.map((w) => `${w}:*`).join(" & ");
}

// ---------------------------------------------------------------------------
// Ride search
// ---------------------------------------------------------------------------

export async function searchRidesFullText(
  query: string,
  options?: { limit?: number; dateFrom?: string; dateTo?: string }
): Promise<SearchResult[]> {
  const supabase = await createClient();
  const tsQuery = toTsQuery(query);
  if (!tsQuery) return [];

  const limit = Math.min(options?.limit ?? 20, 50);

  let dbQuery = supabase
    .from("rides")
    .select(`
      id, driver_id, from_city, to_city, date, time, seats, price, status, search_vector,
      profiles!inner(name, avatar_url, rating)
    `)
    .textSearch("search_vector", tsQuery, {
      type: "websearch",
      config: "simple",
    })
    .eq("status", "active")
    .gte("date", options?.dateFrom ?? new Date().toISOString().split("T")[0]);

  if (options?.dateTo) {
    dbQuery = dbQuery.lte("date", options.dateTo);
  }

  const { data, error } = await dbQuery.limit(limit);

  if (error || !data) {
    console.error("[search] searchRidesFullText error:", error?.message);
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((ride) => ({
    id: ride.id as string,
    type: "ride",
    rank: 0, // Would need ts_rank from raw SQL
    title: `${ride.from_city} → ${ride.to_city}`,
    subtitle: `${ride.date as string} ${ride.time as string} · ${ride.seats} posti`,
    data: ride,
  }));
}

// ---------------------------------------------------------------------------
// User search
// ---------------------------------------------------------------------------

export async function searchUsers(
  query: string,
  options?: { limit?: number; verifiedOnly?: boolean }
): Promise<SearchResult[]> {
  const supabase = await createClient();
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const limit = Math.min(options?.limit ?? 10, 50);

  let dbQuery = supabase
    .from("profiles")
    .select("id, name, avatar_url, rating, review_count, rides_count, slug, phone_verified, id_verified")
    .or(`name.ilike.%${normalized}%,slug.ilike.%${normalized}%`)
    .gt("rides_count", 0)
    .order("rating", { ascending: false })
    .limit(limit);

  if (options?.verifiedOnly) {
    dbQuery = dbQuery.or("phone_verified.eq.true,id_verified.eq.true");
  }

  const { data, error } = await dbQuery;

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((user) => ({
    id: user.id as string,
    type: "user",
    rank: (user.rating as number) ?? 0,
    title: user.name as string,
    subtitle: `${user.rides_count} corse · ${user.rating}★`,
    data: user,
  }));
}

// ---------------------------------------------------------------------------
// Group/Event search
// ---------------------------------------------------------------------------

export async function searchGroups(query: string, limit = 10): Promise<SearchResult[]> {
  const supabase = await createClient();
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const { data, error } = await supabase
    .from("carpool_groups")
    .select("id, name, slug, description, member_count, created_at")
    .or(`name.ilike.%${normalized}%,description.ilike.%${normalized}%`)
    .limit(limit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((group) => ({
    id: group.id as string,
    type: "group",
    rank: (group.member_count as number) ?? 0,
    title: group.name as string,
    subtitle: `${group.member_count} membri`,
    data: group,
  }));
}

export async function searchEvents(query: string, limit = 10): Promise<SearchResult[]> {
  const supabase = await createClient();
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("events")
    .select("id, name, slug, description, date, location")
    .or(`name.ilike.%${normalized}%,description.ilike.%${normalized}%,location.ilike.%${normalized}%`)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((event) => ({
    id: event.id as string,
    type: "event",
    rank: 0,
    title: event.name as string,
    subtitle: `${event.date as string} · ${event.location as string}`,
    data: event,
  }));
}

// ---------------------------------------------------------------------------
// Unified search
// ---------------------------------------------------------------------------

export async function unifiedSearch(
  query: string,
  options?: FullTextSearchOptions
): Promise<SearchResult[]> {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < 2) return [];

  const types = options?.types ?? ["ride", "user", "group", "event"];
  const limit = Math.min(options?.limit ?? 20, 50);
  const perTypeLimit = Math.ceil(limit / types.length);

  const promises: Promise<SearchResult[]>[] = [];

  if (types.includes("ride")) {
    promises.push(searchRidesFullText(query, { limit: perTypeLimit }));
  }
  if (types.includes("user")) {
    promises.push(searchUsers(query, { limit: perTypeLimit }));
  }
  if (types.includes("group")) {
    promises.push(searchGroups(query, perTypeLimit));
  }
  if (types.includes("event")) {
    promises.push(searchEvents(query, perTypeLimit));
  }

  const results = await Promise.all(promises);
  const combined = results.flat();

  // Sort by rank, then by type priority
  const typePriority: Record<string, number> = { ride: 4, user: 3, event: 2, group: 1 };
  combined.sort((a, b) => {
    const rankDiff = b.rank - a.rank;
    if (rankDiff !== 0) return rankDiff;
    return (typePriority[b.type] ?? 0) - (typePriority[a.type] ?? 0);
  });

  return combined.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Search suggestions / autocomplete
// ---------------------------------------------------------------------------

export async function getSearchSuggestions(
  prefix: string,
  options?: { limit?: number }
): Promise<string[]> {
  const supabase = await createServiceRoleClient();
  const limit = Math.min(options?.limit ?? 8, 20);
  const normalized = normalizeQuery(prefix);
  if (!normalized || normalized.length < 2) return [];

  // Get matching cities from rides
  const [{ data: fromCities }, { data: toCities }] = await Promise.all([
    supabase
      .from("rides")
      .select("from_city")
      .ilike("from_city", `${normalized}%`)
      .eq("status", "active")
      .gte("date", new Date().toISOString().split("T")[0])
      .limit(limit),
    supabase
      .from("rides")
      .select("to_city")
      .ilike("to_city", `${normalized}%`)
      .eq("status", "active")
      .gte("date", new Date().toISOString().split("T")[0])
      .limit(limit),
  ]);

  const suggestions = new Set<string>();

  for (const row of (fromCities ?? []) as Array<{ from_city: string }>) {
    suggestions.add(row.from_city);
  }
  for (const row of (toCities ?? []) as Array<{ to_city: string }>) {
    suggestions.add(row.to_city);
  }

  return Array.from(suggestions).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Typo correction (basic)
// ---------------------------------------------------------------------------

export async function correctTypo(query: string): Promise<string | null> {
  const supabase = await createServiceRoleClient();

  // Use pg_trgm similarity for fuzzy matching
  const { data, error } = await supabase.rpc("find_similar_city", {
    search_term: query,
    similarity_threshold: 0.3,
  });

  if (error || !data || data.length === 0) return null;

  return data[0]?.city as string | null;
}
