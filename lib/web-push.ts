import webPush from "web-push";

export function ensureVapidDetails(): void {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "Missing VAPID configuration: VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY must all be set."
    );
  }

  try {
    webPush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    throw new Error(
      `Invalid VAPID key format: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export { webPush };
