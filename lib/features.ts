/**
 * Centralized feature flags for Andamus.
 *
 * WAITLIST_MODE — When true, the app is gated behind a coming-soon / waitlist
 * experience. When false, the full app is publicly accessible.
 *
 * Controlled via NEXT_PUBLIC_WAITLIST_MODE env variable so it is available
 * in both server and browser contexts.
 */
export const FEATURES = {
  WAITLIST_MODE: process.env.NEXT_PUBLIC_WAITLIST_MODE === "true",
} as const;
