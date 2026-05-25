"use server";

import { createClient } from "@/lib/supabase/server";
import { checkServerRateLimit } from "@/lib/rate-limit";
import { sanitizeRideData, isValidCity, detectSuspiciousPatterns } from "@/lib/security";
import { isRideExpired } from "@/lib/date-utils";
import { checkRideLimit, recordActivity } from "@/lib/retention";
import { Analytics } from "@/lib/analytics";
import { revalidatePath } from "next/cache";
import { getAppNow, buildNotExpiredOrFilter } from "@/lib/date-utils";

export type CreateRideInput = {
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  meeting_point?: string | null;
  notes?: string | null;
  smoking_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  large_luggage?: boolean | null;
  music_preference?: string | null;
  women_only?: boolean | null;
  students_only?: boolean | null;
  car_model?: string | null;
  car_color?: string | null;
  car_plate?: string | null;
  car_year?: number | null;
  stops?: string[];
};

/**
 * Server action to create a single ride with full validation,
 * rate limiting, and duplicate detection.
 */
export async function createRide(input: CreateRideInput) {
  const supabase = await createClient();

  // ── Auth check ──
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Devi essere autenticato per pubblicare un passaggio.");
  }

  // ── Rate limit: 10 rides per 24h ──
  const rateLimit = await checkServerRateLimit(
    user.id,
    "create_ride",
    10,
    24
  );
  if (!rateLimit.allowed) {
    throw new Error(
      "Hai pubblicato troppi passaggi. Riprova più tardi."
    );
  }

  // ── Subscription ride limit check ──
  const rideLimit = await checkRideLimit(user.id);
  if (!rideLimit.allowed) {
    throw new Error(
      `Hai raggiunto il limite di ${rideLimit.limit} corse al mese con il piano gratuito. Passa a Premium per pubblicare senza limiti.`
    );
  }

  // ── Server-side validation ──
  const validation = sanitizeRideData({
    from_city: input.from_city,
    to_city: input.to_city,
    date: input.date,
    time: input.time,
    price: input.price,
    seats: input.seats,
    description: input.notes || undefined,
  });

  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  const sanitized = validation.sanitized!;

  // ── Additional checks ──
  if (isRideExpired(sanitized.date, sanitized.time)) {
    throw new Error("Non puoi pubblicare un passaggio nel passato.");
  }

  // ── Anti-spam heuristics ──
  const suspicious = detectSuspiciousPatterns({
    from_city: sanitized.from_city,
    to_city: sanitized.to_city,
    notes: sanitized.description,
    price: sanitized.price,
  });
  if (suspicious.length >= 2) {
    // Log to user_actions for diagnostics but still allow (soft block)
    await supabase.from("user_actions").insert({
      user_id: user.id,
      action: "suspicious_ride",
      metadata: { violations: suspicious, input: { from: sanitized.from_city, to: sanitized.to_city } },
    });
    throw new Error(
      "Il contenuto del passaggio sembra sospetto. Se necessario, contatta il supporto."
    );
  }

  // Validate stops if provided
  if (input.stops && input.stops.length > 0) {
    if (input.stops.some((s) => s === sanitized.from_city || s === sanitized.to_city)) {
      throw new Error("Le fermate non possono coincidere con partenza o arrivo.");
    }
    if (input.stops.some((s) => !isValidCity(s))) {
      throw new Error("Una o più fermate non sono valide.");
    }
  }

  // Validate preferences
  if (
    input.music_preference &&
    !["quiet", "music", "talk"].includes(input.music_preference)
  ) {
    throw new Error("Preferenza musicale non valida.");
  }

  // ── Duplicate detection: identical ride in last 5 minutes ──
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentDuplicate, error: dupError } = await supabase
    .from("rides")
    .select("id")
    .eq("driver_id", user.id)
    .eq("from_city", sanitized.from_city)
    .eq("to_city", sanitized.to_city)
    .eq("date", sanitized.date)
    .eq("time", sanitized.time)
    .gte("created_at", fiveMinutesAgo)
    .maybeSingle();

  if (dupError) {
    console.error("[createRide] duplicate check error:", dupError);
  }
  if (recentDuplicate) {
    throw new Error(
      "Hai già pubblicato questo passaggio pochi minuti fa."
    );
  }

  // ── Insert ride ──
  const { data: inserted, error: insertError } = await supabase
    .from("rides")
    .insert({
      driver_id: user.id,
      from_city: sanitized.from_city,
      to_city: sanitized.to_city,
      date: sanitized.date,
      time: sanitized.time,
      seats: sanitized.seats,
      price: sanitized.price,
      meeting_point: input.meeting_point || null,
      notes: sanitized.description || null,
      status: "active",
      smoking_allowed: input.smoking_allowed ?? null,
      pets_allowed: input.pets_allowed ?? null,
      large_luggage: input.large_luggage ?? null,
      music_preference: input.music_preference || null,
      women_only: input.women_only ?? null,
      students_only: input.students_only ?? null,
      car_model: input.car_model || null,
      car_color: input.car_color || null,
      car_plate: input.car_plate || null,
      car_year: input.car_year || null,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    console.error("[createRide] insert error:", insertError);
    throw new Error("Errore durante la pubblicazione del passaggio.");
  }

  // ── Insert stops ──
  if (input.stops && input.stops.length > 0) {
    const { error: stopsError } = await supabase.from("ride_stops").insert(
      input.stops.map((city, index) => ({
        ride_id: inserted.id,
        city,
        order_index: index,
      }))
    );
    if (stopsError) {
      console.error("[createRide] stops insert error:", stopsError);
      // Non-fatal: ride was created successfully
    }
  }

  revalidatePath("/cerca");

  // ── Record activity for streak tracking ──
  await recordActivity(user.id, "ride_published");

  // ── First ride analytics ──
  const { count: rideCount } = await supabase
    .from("rides")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", user.id);

  if (rideCount === 1) {
    Analytics.firstRidePublished();
  }

  return { rideId: inserted.id, success: true };
}

/* ────────────────────────────────────────────────────────────────── */
/*  Search Rides                                                     */
/* ────────────────────────────────────────────────────────────────── */

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    driver_id: string;
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
