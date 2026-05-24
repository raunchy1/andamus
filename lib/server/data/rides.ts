"use server";

import { createClient } from "@/lib/supabase/server";

import { getAppNow, buildNotExpiredOrFilter } from "@/lib/date-utils";

export interface RideProfile {
  name: string;
  avatar_url: string | null;
  rating: number;
  review_count?: number | null;
  rides_count: number;
  completed_rides_count?: number | null;
  phone_verified?: boolean;
  id_verified?: boolean;
}

export interface Ride {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  meeting_point: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  smoking_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  large_luggage?: boolean | null;
  music_preference?: "quiet" | "music" | "talk" | null;
  women_only?: boolean | null;
  students_only?: boolean | null;
  car_model?: string | null;
  car_color?: string | null;
  car_plate?: string | null;
  car_year?: number | null;
  profiles: RideProfile;
}

export interface RideStop {
  city: string;
  order_index: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    name: string;
    avatar_url: string | null;
  };
}

export interface SearchFilters {
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
}

const TIME_RANGES = {
  morning: { from: "05:00:00", to: "11:59:59" },
  afternoon: { from: "12:00:00", to: "16:59:59" },
  evening: { from: "17:00:00", to: "21:59:59" },
  night: { from: "22:00:00", to: "04:59:59" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: SearchFilters) {
  if (filters.origin) query = query.eq("from_city", filters.origin);
  if (filters.destination) query = query.eq("to_city", filters.destination);

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

  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    query = query.lte("price", filters.maxPrice);
  }
  if (filters.minSeats !== undefined && filters.minSeats > 0) {
    query = query.gte("seats", filters.minSeats);
  }

  if (filters.smoking) query = query.eq("smoking_allowed", true);
  if (filters.pets) query = query.eq("pets_allowed", true);
  if (filters.luggage) query = query.eq("large_luggage", true);
  if (filters.womenOnly) query = query.eq("women_only", true);
  if (filters.studentsOnly) query = query.eq("students_only", true);
  if (filters.musicPreference) query = query.eq("music_preference", filters.musicPreference);
  if (filters.freeOnly) query = query.eq("price", 0);

  return query;
}

/**
 * Get a single ride by ID with driver profile.
 */
export async function getRideById(rideId: string): Promise<Ride | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rides")
    .select(`*, profiles!inner(name, avatar_url, rating, rides_count, review_count, phone_verified, id_verified)`)
    .eq("id", rideId)
    .single();

  if (error || !data) {
    console.error("[data/rides] getRideById error:", error?.message);
    return null;
  }
  return data as Ride;
}

/**
 * Get stops for a ride.
 */
export async function getRideStops(rideId: string): Promise<RideStop[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ride_stops")
    .select("city, order_index")
    .eq("ride_id", rideId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[data/rides] getRideStops error:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Get reviews for a driver.
 */
export async function getDriverReviews(driverId: string, limit = 3): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(`id, rating, comment, created_at, reviewer:profiles(name, avatar_url)`)
    .eq("reviewed_id", driverId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[data/rides] getDriverReviews error:", error.message);
    return [];
  }
  return (data || []).map((r: Record<string, unknown>) => {
    const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
    return {
      id: r.id as string,
      rating: r.rating as number,
      comment: r.comment as string,
      created_at: r.created_at as string,
      reviewer: reviewer as { name: string; avatar_url: string | null },
    };
  }) as Review[];
}

/**
 * Get similar rides (same route, active, future).
 */
export async function getSimilarRides(ride: Ride, limit = 3): Promise<Ride[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("rides")
    .select(`*, profiles!inner(name, avatar_url, rating, review_count)`)
    .eq("from_city", ride.from_city)
    .eq("status", "active")
    .neq("id", ride.id)
    .gte("date", today)
    .limit(limit);

  if (error) {
    console.error("[data/rides] getSimilarRides error:", error.message);
    return [];
  }
  return (data || []) as Ride[];
}

/**
 * Check if a user has an existing booking on a ride.
 */
export async function getRideBookingForUser(rideId: string, userId: string | undefined): Promise<{ id: string; ride_id: string; passenger_id: string; status: string } | null> {
  if (!userId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("ride_id", rideId)
    .eq("passenger_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[data/rides] getRideBookingForUser error:", error.message);
    return null;
  }
  return data as { id: string; ride_id: string; passenger_id: string; status: string };
}

/**
 * Search rides with filters.
 */
export async function searchRides(filters: SearchFilters): Promise<Ride[]> {
  const supabase = await createClient();
  const { date: today } = getAppNow();

  let query = supabase
    .from("rides")
    .select(`*, profiles!inner(name, avatar_url, rating, review_count, rides_count, phone_verified, id_verified)`)
    .eq("status", "active")
    .or(buildNotExpiredOrFilter());

  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);
  if (filters.todayOnly) query = query.eq("date", today);

  query = applyFilters(query, filters);

  const { data, error } = await query
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .order("profiles(rating)", { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    console.error("[data/rides] searchRides error:", error.message);
    return [];
  }

  let results = (data || []) as Ride[];

  if (filters.verifiedOnly) {
    results = results.filter(
      (ride) => ride.profiles.phone_verified || ride.profiles.id_verified
    );
  }

  return results;
}

/**
 * Get today's active rides for the homepage.
 */
export async function getTodayRides(limit = 6): Promise<Ride[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("rides")
    .select(`*, profiles!inner(name, avatar_url, rating, review_count)`)
    .eq("status", "active")
    .eq("date", today)
    .order("time", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[data/rides] getTodayRides error:", error.message);
    return [];
  }
  return (data || []) as Ride[];
}
