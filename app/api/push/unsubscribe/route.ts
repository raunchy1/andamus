import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withAuth, apiError, apiSuccess, parseBody } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { z } from "zod";
import type { AuthContext } from "@/lib/server/guards/auth";

const unsubscribeSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
});

async function handler(req: NextRequest, ctx: AuthContext) {
  const body = await parseBody(req, unsubscribeSchema);

  const supabase = await createClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint)
    .eq("user_id", ctx.userId);

  if (error) {
    console.error("[push/unsubscribe] DB error:", error);
    return apiError("Failed to remove subscription", "DB_ERROR", 500);
  }

  return apiSuccess({ unsubscribed: true });
}

export const POST = withAuth(handler, { rateLimit: rateLimitPresets.strict });
