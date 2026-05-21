"use server";

import { createClient } from "@/lib/supabase/server";
import { checkServerRateLimit } from "@/lib/rate-limit";
import { sanitizeRideData, isValidCity, detectSuspiciousPatterns } from "@/lib/security";
import { isRideExpired } from "@/lib/date-utils";
import { checkRideLimit, recordActivity } from "@/lib/retention";
import { Analytics } from "@/lib/analytics";
import { revalidatePath } from "next/cache";

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
