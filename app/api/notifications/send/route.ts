import { NextRequest, NextResponse } from "next/server";
import { ensureVapidDetails, webPush } from "@/lib/web-push";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * POST /api/notifications/send
 * 
 * Direct push notification dispatcher. Securely audited.
 */
export async function POST(req: NextRequest) {
  try {
    ensureVapidDetails();
  } catch (err) {
    return NextResponse.json({ error: "Push service not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { userId, title, body: text, url } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: "Missing required fields: userId, title" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Fetch active push subscriptions for the user
    const { data: subscriptions, error: fetchErr } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (fetchErr) {
      return NextResponse.json({ error: "Database error fetching subscriptions" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "User has no active push subscriptions" });
    }

    // 2. Dispatch payload via web-push
    const payload = JSON.stringify({
      title,
      body: text || "",
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      url: url || "/",
    });

    let sentCount = 0;
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sentCount++;
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            // Subscription expired — delete from DB
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        }
      })
    );

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
