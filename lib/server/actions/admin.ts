"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { requireAdmin } from "@/lib/server/guards/admin";

export async function resolveFeedback(feedbackId: string, notes?: string) {
  const ctx = await requireAdmin();

  const sr = createServiceRoleClient();
  const { error } = await sr
    .from("beta_feedback")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: ctx.userId,
      notes: notes || null,
    })
    .eq("id", feedbackId);

  if (error) {
    console.error("[admin-actions] resolve feedback error:", error.message);
    throw new Error("Database error");
  }

  return { success: true };
}
