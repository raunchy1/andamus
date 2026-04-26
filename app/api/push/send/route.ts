import { NextRequest, NextResponse } from "next/server";
import { ensureVapidDetails, webPush } from "@/lib/web-push";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    ensureVapidDetails();
    const { endpoint, title, body, icon, url } = await req.json();
    if (!endpoint || !title) {
      return NextResponse.json({ error: "Missing endpoint or title" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the subscription belongs to the authenticated user
    const { data: sub } = await supabase
      .from("push_subscriptions")
      .select("p256dh, auth, user_id")
      .eq("endpoint", endpoint)
      .single();

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (sub.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = JSON.stringify({ title, body: body || "", icon: icon || "/icon-192x192.png", url: url || "/" });

    await webPush.sendNotification(
      { endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
