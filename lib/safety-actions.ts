"use server";

import { createClient } from "@/lib/supabase/server";
import { checkServerRateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/security";

export type ReportUserInput = {
  reported_id: string;
  ride_id?: string | null;
  type: string;
  description?: string | null;
};

const VALID_REPORT_REASONS = [
  "inappropriate_behavior",
  "no_show",
  "fake_profile",
  "unsafe_driving",
  "harassment",
  "other",
];

/**
 * Server action to submit a safety report with rate limiting
 * and input sanitization.
 */
export async function submitSafetyReport(input: ReportUserInput) {
  const supabase = await createClient();

  // ── Auth check ──
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Devi essere autenticato per inviare una segnalazione.");
  }

  // ── Self-report prevention ──
  if (user.id === input.reported_id) {
    throw new Error("Non puoi segnalare te stesso.");
  }

  // ── Rate limit: 5 reports per 24h ──
  const rateLimit = await checkServerRateLimit(
    user.id,
    "safety_report",
    5,
    24
  );
  if (!rateLimit.allowed) {
    throw new Error(
      "Hai inviato troppe segnalazioni. Riprova più tardi."
    );
  }

  // ── Input validation ──
  if (!VALID_REPORT_REASONS.includes(input.type)) {
    throw new Error("Motivo della segnalazione non valido.");
  }

  const sanitizedDescription = input.description
    ? sanitizeInput(input.description.trim()).slice(0, 2000)
    : null;

  // ── Insert report ──
  const { error } = await supabase.from("safety_reports").insert({
    reporter_id: user.id,
    reported_id: input.reported_id,
    ride_id: input.ride_id || null,
    type: input.type,
    description: sanitizedDescription,
  });

  if (error) {
    console.error("[submitSafetyReport] insert error:", error);
    throw new Error("Errore durante l'invio della segnalazione.");
  }

  return { success: true };
}
