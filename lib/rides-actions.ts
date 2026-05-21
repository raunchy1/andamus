"use server";

import { createClient } from "@/lib/supabase/server";
import { getAppNow, buildNotExpiredOrFilter } from "@/lib/date-utils";

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

function applyFilters(
  query: any,
  filters: SearchFilters
) {
  // ── City filters ──
  if (filters.origin) query = query.eq("from_city", filters.origin);
  if (filters.destination) query = query.eq("to_city", filters.destination);

  // ── Time window ──
  if (filters.timeWindow && TIME_RANGES[filters.timeWindow]) {
    const range = TIME_RANGES[filters.timeWindow];
    if (filters.timeWindow === "night") {
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

  return query;
}

export async function searchRides(filters: SearchFilters) {
  const supabase = await createClient();
  const { date: today } = getAppNow();

  // Base query: active rides that haven't expired
  let query = supabase
    .from("rides")
    .select(
      `
      *,
      profiles!inner(name, avatar_url, rating, review_count, rides_count, phone_verified, id_verified)
    `
    )
    .eq("status", "active")
    .or(buildNotExpiredOrFilter());

  // ── Date range ──
  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);
  if (filters.todayOnly) query = query.eq("date", today);

  query = applyFilters(query, filters);

  // Order: upcoming first, then by time, then by driver rating (better drivers first)
  const { data, error } = await query
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .order("profiles(rating)", { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    console.error("[searchRides] Supabase error:", error);
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
      review_count?: number | null;
      rides_count?: number | null;
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
    const prevStr = prev.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
    const nextStr = next.toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });

    let nearbyQuery = supabase
      .from("rides")
      .select(
        `
        *,
        profiles!inner(name, avatar_url, rating, review_count, rides_count, phone_verified, id_verified)
      `
      )
      .eq("status", "active")
      .or(buildNotExpiredOrFilter())
      .gte("date", prevStr)
      .lte("date", nextStr);

    nearbyQuery = applyFilters(nearbyQuery, filters);

    const { data: nearbyData } = await nearbyQuery
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .order("profiles(rating)", { ascending: false, nullsFirst: false })
      .limit(200);

    if (nearbyData && nearbyData.length > 0) {
      results = nearbyData as typeof results;
    }
  }

  return results;
}
