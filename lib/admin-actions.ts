"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isAdmin } from "@/lib/admin-config";

export async function resolveFeedback(feedbackId: string, notes?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!isAdmin(profile?.email)) {
    throw new Error("Forbidden");
  }

  const sr = createServiceRoleClient();
  const { error } = await sr
    .from("beta_feedback")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      notes: notes || null,
    })
    .eq("id", feedbackId);

  if (error) {
    console.error("[admin-actions] resolve feedback error:", error.message);
    throw new Error("Database error");
  }

  return { success: true };
}
