import { NextRequest } from "next/server";
import { ensureVapidDetails, webPush } from "@/lib/web-push";
import { createClient } from "@/lib/supabase/server";
import { withAuth, apiError, apiSuccess, parseBody } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/rate-limit/redis";
import { pushSendSchema } from "@/lib/validators/notifications";
import type { AuthContext } from "@/lib/server/guards/auth";

async function handler(req: NextRequest, ctx: AuthContext) {
  ensureVapidDetails();

  const body = await parseBody(req, pushSendSchema);

  const supabase = await createClient();

  // Verify the subscription belongs to the authenticated user
  const { data: sub, error: subError } = await supabase
    .from("push_subscriptions")
    .select("p256dh, auth, user_id")
    .eq("endpoint", body.endpoint)
    .maybeSingle();

  if (subError) {
    console.error("[push/send] DB error:", subError);
    return apiError("Database error", "DB_ERROR", 500);
  }

  if (!sub) {
    return apiError("Subscription not found", "NOT_FOUND", 404);
  }

  if (sub.user_id !== ctx.userId) {
    return apiError("You do not own this subscription", "FORBIDDEN", 403);
  }

  const payload = JSON.stringify({
    title: body.title,
    body: body.body || "",
    icon: body.icon || "/icon-192x192.png",
    url: body.url || "/",
  });

  try {
    await webPush.sendNotification(
      { endpoint: body.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    );
    return apiSuccess({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    console.error("[push/send] WebPush error:", message);
    return apiError(message, "SEND_FAILED", 500);
  }
}

export const POST = withAuth(handler, { rateLimit: rateLimitPresets.standard });
