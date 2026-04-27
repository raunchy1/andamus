"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchFilters = {
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  timeWindow?: "morning" | "afternoon" | "evening" | "night" | "";
  maxPrice?: number;
  minSeats?: number;
  smoking?: boolean;
  pets?: boolean;
  luggage?: boolean;
  womenOnly?: boolean;
  studentsOnly?: boolean;
  musicPreference?: string;
  verifiedOnly?: boolean;
  freeOnly?: boolean;
  todayOnly?: boolean;
};

const TIME_RANGES = {
  morning: { from: "05:00:00", to: "11:59:59" },
  afternoon: { from: "12:00:00", to: "16:59:59" },
  evening: { from: "17:00:00", to: "21:59:59" },
  night: { from: "22:00:00", to: "04:59:59" },
};

export async function searchRides(filters: SearchFilters) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("rides")
    .select(
      `
      *,
      profiles!inner(name, avatar_url, rating, phone_verified, id_verified)
    `
    )
    .eq("status", "active")
    .gte("date", today);

  // ── City filters ──
  if (filters.origin) query = query.eq("from_city", filters.origin);
  if (filters.destination) query = query.eq("to_city", filters.destination);

  // ── Date range ──
  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);

  // ── Time window ──
  if (filters.timeWindow && TIME_RANGES[filters.timeWindow]) {
    const range = TIME_RANGES[filters.timeWindow];
    if (filters.timeWindow === "night") {
      // Night spans across midnight: 22:00 - 04:59
      query = query.or(
        `and(time.gte.${range.from},time.lte.23:59:59),and(time.gte.00:00:00,time.lte.${range.to})`
      );
    } else {
      query = query.gte("time", range.from).lte("time", range.to);
    }
  }

  // ── Price & Seats ──
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    query = query.lte("price", filters.maxPrice);
  }
  if (filters.minSeats !== undefined && filters.minSeats > 0) {
    query = query.gte("seats", filters.minSeats);
  }

  // ── Preferences ──
  if (filters.smoking) query = query.eq("smoking_allowed", true);
  if (filters.pets) query = query.eq("pets_allowed", true);
  if (filters.luggage) query = query.eq("large_luggage", true);
  if (filters.womenOnly) query = query.eq("women_only", true);
  if (filters.studentsOnly) query = query.eq("students_only", true);
  if (filters.musicPreference)
    query = query.eq("music_preference", filters.musicPreference);

  // ── Quick filters ──
  if (filters.freeOnly) query = query.eq("price", 0);
  if (filters.todayOnly) query = query.eq("date", today);

  const { data, error } = await query
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .limit(200);

  if (error) {
    // Error logged to Sentry in production
    return [];
  }

  let results = (data || []) as Array<{
    id: string;
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    seats: number;
    price: number;
    created_at?: string;
    smoking_allowed?: boolean | null;
    pets_allowed?: boolean | null;
    large_luggage?: boolean | null;
    music_preference?: "quiet" | "music" | "talk" | null;
    women_only?: boolean | null;
    students_only?: boolean | null;
    profiles: {
      name: string;
      avatar_url: string | null;
      rating: number;
      phone_verified?: boolean;
      id_verified?: boolean;
    };
  }>;

  // ── Verified filter (client-side because it involves profiles) ──
  if (filters.verifiedOnly) {
    results = results.filter(
      (ride) => ride.profiles.phone_verified || ride.profiles.id_verified
    );
  }

  // ── Nearby date fallback ──
  if (
    filters.dateFrom &&
    !filters.dateTo &&
    results.length === 0 &&
    filters.origin &&
    filters.destination
  ) {
    const d = new Date(filters.dateFrom);
    const prev = new Date(d);
    prev.setDate(d.getDate() - 1);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const prevStr = prev.toISOString().split("T")[0];
    const nextStr = next.toISOString().split("T")[0];

    let nearbyQuery = supabase
      .from("rides")
      .select(
        `
        *,
        profiles!inner(name, avatar_url, rating, phone_verified, id_verified)
      `
      )
      .eq("status", "active")
      .gte("date", prevStr)
      .lte("date", nextStr);

    if (filters.origin) nearbyQuery = nearbyQuery.eq("from_city", filters.origin);
    if (filters.destination)
      nearbyQuery = nearbyQuery.eq("to_city", filters.destination);
    if (filters.maxPrice !== undefined && filters.maxPrice > 0)
      nearbyQuery = nearbyQuery.lte("price", filters.maxPrice);
    if (filters.minSeats !== undefined && filters.minSeats > 0)
      nearbyQuery = nearbyQuery.gte("seats", filters.minSeats);
    if (filters.smoking) nearbyQuery = nearbyQuery.eq("smoking_allowed", true);
    if (filters.pets) nearbyQuery = nearbyQuery.eq("pets_allowed", true);
    if (filters.luggage) nearbyQuery = nearbyQuery.eq("large_luggage", true);
    if (filters.womenOnly) nearbyQuery = nearbyQuery.eq("women_only", true);
    if (filters.studentsOnly) nearbyQuery = nearbyQuery.eq("students_only", true);
    if (filters.musicPreference)
      nearbyQuery = nearbyQuery.eq("music_preference", filters.musicPreference);

    const { data: nearbyData } = await nearbyQuery
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(200);

    if (nearbyData && nearbyData.length > 0) {
      results = nearbyData as typeof results;
    }
  }

  return results;
}
