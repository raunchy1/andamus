import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withAuth, apiError, apiSuccess, parseBody } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { pushSubscriptionSchema } from "@/lib/validators/notifications";
import type { AuthContext } from "@/lib/server/guards/auth";

async function handler(req: NextRequest, ctx: AuthContext) {
  const body = await parseBody(req, pushSubscriptionSchema);

  const supabase = await createClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({
      user_id: ctx.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    }, { onConflict: "endpoint" });

  if (error) {
    console.error("[push/subscribe] DB error:", error);
    return apiError("Failed to save subscription", "DB_ERROR", 500);
  }

  return apiSuccess({ subscribed: true });
}

export const POST = withAuth(handler, { rateLimit: rateLimitPresets.strict });
