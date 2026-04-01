import webPush from "web-push";

export function ensureVapidDetails() {
  if (
    process.env.VAPID_SUBJECT &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  ) {
    try {
      webPush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } catch {
      // may throw if already set or invalid; safe to ignore
    }
  }
}

export { webPush };
