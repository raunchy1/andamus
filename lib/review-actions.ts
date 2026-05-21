"use server";

import { createClient } from "@/lib/supabase/server";
import { checkServerRateLimit } from "@/lib/rate-limit";
import { isValidRating, isValidComment } from "@/lib/security";
import { computeRideStatus } from "@/lib/ride-status";
import { revalidatePath } from "next/cache";

export type SubmitReviewInput = {
  ride_id: string;
  reviewed_id: string;
  rating: number;
  comment?: string | null;
};

/**
 * Server action to submit a review with strict validation,
 * rate limiting, and participation verification.
 */
export async function submitReview(input: SubmitReviewInput) {
  const supabase = await createClient();

  // ── Auth check ──
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Devi essere autenticato per lasciare una recensione.");
  }

  // ── Self-review prevention ──
  if (user.id === input.reviewed_id) {
    throw new Error("Non puoi recensire te stesso.");
  }

  // ── Rate limit: 5 reviews per 24h ──
  const rateLimit = await checkServerRateLimit(
    user.id,
    "submit_review",
    5,
    24
  );
  if (!rateLimit.allowed) {
    throw new Error(
      "Hai lasciato troppe recensioni. Riprova più tardi."
    );
  }

  // ── Input validation ──
  if (!isValidRating(input.rating)) {
    throw new Error("La valutazione deve essere tra 1 e 5 stelle.");
  }
  if (input.comment && !isValidComment(input.comment)) {
    throw new Error("Il commento è troppo lungo (massimo 1000 caratteri).");
  }

  // ── Verify ride exists and is completed ──
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("id, status, date, time, driver_id")
    .eq("id", input.ride_id)
    .single();

  if (rideError || !ride) {
    throw new Error("Passaggio non trovato.");
  }

  const rideStatus = computeRideStatus(ride.status, ride.date, ride.time);
  if (rideStatus !== "completed") {
    throw new Error(
      "Puoi recensire solo passaggi completati."
    );
  }

  // ── Strict participation check: reviewer must be a confirmed passenger ──
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("ride_id", input.ride_id)
    .eq("passenger_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();

  if (bookingError) {
    console.error("[submitReview] booking check error:", bookingError);
  }

  // Also allow the driver to review the passenger
  const isDriver = ride.driver_id === user.id;
  if (!booking && !isDriver) {
    throw new Error(
      "Puoi recensire solo utenti con cui hai condiviso un passaggio confermato."
    );
  }

  // ── Insert review ──
  const { data: review, error: insertError } = await supabase
    .from("reviews")
    .insert({
      ride_id: input.ride_id,
      reviewer_id: user.id,
      reviewed_id: input.reviewed_id,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      throw new Error("Hai già recensito questo passaggio.");
    }
    console.error("[submitReview] insert error:", insertError);
    throw new Error("Errore durante l'invio della recensione.");
  }

  revalidatePath(`/corsa/${input.ride_id}`);
  revalidatePath("/profilo");

  return { review, success: true };
}
