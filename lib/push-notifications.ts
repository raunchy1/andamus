"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureVapidDetails, webPush } from "@/lib/web-push";

/**
 * Send a push notification to all devices subscribed by a user.
 * Non-blocking: failures are logged but not thrown.
 */
export async function sendPushToUser({
  userId,
  title,
  body,
  url,
}: {
  userId: string;
  title: string;
  body: string;
  url: string;
}) {
  try {
    ensureVapidDetails();
  } catch {
    // VAPID not configured — skip push silently
    return;
  }

  const sr = createServiceRoleClient();

  const { data: subscriptions } = await sr
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    url,
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — clean up
          await sr.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    })
  );
}
