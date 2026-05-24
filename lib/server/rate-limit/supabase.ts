import { createClient } from "@/lib/supabase/server";

/**
 * Server-side rate limit check using Supabase.
 * Counts user actions in a time window and inserts a new action record if allowed.
 */
export async function checkServerRateLimit(
  userId: string,
  action: string,
  maxAttempts: number = 10,
  windowHours: number = 24
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient();

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - windowHours);

  const { count, error } = await supabase
    .from("user_actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("[rate-limit] DB error, denying request:", error.message);
    return { allowed: false, remaining: 0 };
  }

  const currentCount = count || 0;

  if (currentCount >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  await supabase.from("user_actions").insert({
    user_id: userId,
    action: action,
  });

  return { allowed: true, remaining: maxAttempts - currentCount - 1 };
}
