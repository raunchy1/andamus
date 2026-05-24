"use server";

/**
 * Push notification server actions.
 * @deprecated Import directly from `@/lib/server/actions/notifications`.
 */

import { sendPushToUser as _sendPushToUser } from "@/lib/server/actions/notifications";

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  return _sendPushToUser({ userId, title, body, url: url || "/" });
}
