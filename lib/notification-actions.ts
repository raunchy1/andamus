"use server";

/**
 * Notification server actions.
 * @deprecated Import directly from `@/lib/server/actions/notifications`.
 */

import {
  createNotification as _createNotification,
  notifyBookingRequest as _notifyBookingRequest,
  notifyBookingAccepted as _notifyBookingAccepted,
  notifyBookingRejected as _notifyBookingRejected,
  notifyNewMessage as _notifyNewMessage,
  notifyNewReview as _notifyNewReview,
  notifyRideAlert as _notifyRideAlert,
  type NotificationType as _NotificationType,
} from "@/lib/server/actions/notifications";

export type NotificationType = _NotificationType;

export async function createNotification(
  ...args: Parameters<typeof _createNotification>
) {
  return _createNotification(...args);
}

export async function notifyBookingRequest(
  ...args: Parameters<typeof _notifyBookingRequest>
) {
  return _notifyBookingRequest(...args);
}

export async function notifyBookingAccepted(
  ...args: Parameters<typeof _notifyBookingAccepted>
) {
  return _notifyBookingAccepted(...args);
}

export async function notifyBookingRejected(
  ...args: Parameters<typeof _notifyBookingRejected>
) {
  return _notifyBookingRejected(...args);
}

export async function notifyNewMessage(
  ...args: Parameters<typeof _notifyNewMessage>
) {
  return _notifyNewMessage(...args);
}

export async function notifyNewReview(
  ...args: Parameters<typeof _notifyNewReview>
) {
  return _notifyNewReview(...args);
}

export async function notifyRideAlert(
  ...args: Parameters<typeof _notifyRideAlert>
) {
  return _notifyRideAlert(...args);
}
