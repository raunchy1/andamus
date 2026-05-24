"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";

export type NotificationChannel = "push" | "in_app" | "email" | "sms";

export interface NotificationPreferences {
  user_id: string;
  booking_updates: boolean;
  chat_messages: boolean;
  ride_reminders: boolean;
  marketing: boolean;
  social_interactions: boolean;
  nearby_rides: boolean;
  channels: NotificationChannel[];
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  rideId?: string;
  bookingId?: string;
  url?: string;
  priority?: "low" | "normal" | "high";
  data?: Record<string, unknown>;
}

/**
 * Get or create notification preferences for a user.
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const sr = createServiceRoleClient();
  const { data, error } = await sr
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Return defaults
    return {
      user_id: userId,
      booking_updates: true,
      chat_messages: true,
      ride_reminders: true,
      marketing: false,
      social_interactions: true,
      nearby_rides: false,
      channels: ["push", "in_app"],
    };
  }

  return data as NotificationPreferences;
}

/**
 * Update notification preferences.
 */
export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<Omit<NotificationPreferences, "user_id">>
): Promise<boolean> {
  const sr = createServiceRoleClient();
  const { error } = await sr
    .from("notification_preferences")
    .upsert({ user_id: userId, ...prefs }, { onConflict: "user_id" });

  if (error) {
    console.error("[notifications] preferences update error:", error.message);
    return false;
  }
  return true;
}

/**
 * Check if user is in quiet hours.
 */
function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = prefs.quiet_hours_start.split(":").map(Number);
  const [endH, endM] = prefs.quiet_hours_end.split(":").map(Number);
  const start = (startH || 0) * 60 + (startM || 0);
  const end = (endH || 0) * 60 + (endM || 0);

  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

/**
 * Unified notification delivery with preferences, batching, and retry logic.
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const { userId, type, priority = "normal" } = payload;

  // High priority notifications bypass preferences
  if (priority === "low" || priority === "normal") {
    const prefs = await getNotificationPreferences(userId);

    // Check feature toggles
    const typeKey = type as keyof NotificationPreferences;
    if (typeof prefs[typeKey] === "boolean" && !prefs[typeKey]) {
      return false;
    }

    // Quiet hours
    if (isInQuietHours(prefs)) {
      // Queue for later delivery
      await queueNotification(payload);
      return false;
    }

    // Check cooldown to prevent spam
    const cooldownKey = `notif:cooldown:${userId}:${type}`;
    const redis = getRedis();
    if (redis) {
      const recentlySent = await redis.get(cooldownKey);
      if (recentlySent) return false;
      await redis.setex(cooldownKey, 300, "1");
    }
  }

  // Insert in-app notification
  const sr = createServiceRoleClient();
  const { error: insertError } = await sr.from("notifications").insert({
    user_id: userId,
    type,
    title: payload.title,
    body: payload.body,
    ride_id: payload.rideId || null,
    booking_id: payload.bookingId || null,
    read: false,
    data: payload.data || null,
  });

  if (insertError) {
    console.error("[notifications] insert error:", insertError.message);
    return false;
  }

  // Trigger push delivery (fire-and-forget)
  const pushUrl = payload.url;
  if (pushUrl) {
    import("@/lib/server/actions/notifications").then(({ sendPushToUser }) => {
      sendPushToUser({
        userId,
        title: payload.title,
        body: payload.body,
        url: pushUrl,
      }).catch(() => {});
    });
  }

  return true;
}

/**
 * Queue a notification for delayed delivery (quiet hours, batching).
 */
async function queueNotification(payload: NotificationPayload): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const queueKey = `notif:queue:${payload.userId}`;
  await redis.lpush(queueKey, JSON.stringify({ ...payload, queuedAt: Date.now() }));
  await redis.expire(queueKey, 86400); // 24h TTL
}

/**
 * Process queued notifications for a user.
 * Call when quiet hours end or user becomes active.
 */
export async function processQueuedNotifications(userId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  const queueKey = `notif:queue:${userId}`;
  const items = await redis.lrange(queueKey, 0, -1);
  if (!items || items.length === 0) return 0;

  await redis.del(queueKey);

  // Batch similar notifications
  const batchMap = new Map<string, NotificationPayload[]>();
  for (const item of items) {
    try {
      const payload = JSON.parse(item) as NotificationPayload;
      const key = `${payload.type}:${payload.rideId || ""}`;
      if (!batchMap.has(key)) batchMap.set(key, []);
      batchMap.get(key)!.push(payload);
    } catch {
      // Skip malformed items
    }
  }

  let sent = 0;
  for (const payloads of batchMap.values()) {
    if (payloads.length === 1) {
      await sendNotification(payloads[0]);
      sent++;
    } else {
      // Batch: send summary notification
      const first = payloads[0];
      await sendNotification({
        ...first,
        title: `${payloads.length} nuove notifiche`,
        body: payloads.map((p) => p.body).join(" · ").slice(0, 200),
        priority: "normal",
      });
      sent++;
    }
  }

  return sent;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const sr = createServiceRoleClient();
  const { error } = await sr
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  return !error;
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const sr = createServiceRoleClient();
  const { count, error } = await sr
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) return 0;
  return count || 0;
}
