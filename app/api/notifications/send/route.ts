import { NextRequest, NextResponse } from "next/server";
import { ensureVapidDetails, webPush } from "@/lib/web-push";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { withAdmin } from "@/lib/server/api-utils";
import { rateLimitPresets } from "@/lib/server/api-utils";
import type { AuthContext } from "@/lib/server/guards/auth";

/**
 * POST /api/notifications/send
 *
 * Admin-only push notification dispatcher.
 * Requires authenticated admin session + rate limiting.
 *
 * Security: fail-closed — rejects if VAPID is misconfigured or caller is not admin.
 */
async function handler(req: NextRequest, _ctx: AuthContext) {
  try {
    ensureVapidDetails();
  } catch {
    return NextResponse.json(
      { error: "Push service not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { userId, title, body: text, url } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid required field: userId" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid required field: title" },
        { status: 400 }
      );
    }

    // Enforce max lengths to prevent abuse
    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or less" },
        { status: 400 }
      );
    }

    const bodyText = typeof text === "string" ? text.slice(0, 500) : "";
    const targetUrl = typeof url === "string" ? url.slice(0, 500) : "/";

    const supabase = createServiceRoleClient();

    // 1. Fetch active push subscriptions for the user
    const { data: subscriptions, error: fetchErr } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (fetchErr) {
      console.error("[api/notifications/send] DB error:", fetchErr.message);
      return NextResponse.json(
        { error: "Database error fetching subscriptions" },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "User has no active push subscriptions",
      });
    }

    // 2. Dispatch payload via web-push
    const payload = JSON.stringify({
      title: title.slice(0, 200),
      body: bodyText,
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      url: targetUrl,
    });

    let sentCount = 0;
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sentCount++;
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            // Subscription expired — delete from DB
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        }
      })
    );

    return NextResponse.json({ success: true, sent: sentCount });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler, {
  rateLimit: rateLimitPresets.standard,
});
