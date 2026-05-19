// Environment variable validation — runs once on first server import.
// Avoids per-request spam in build and SSR logs.

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "STRIPE_SECRET_KEY",
  "GOOGLE_MAPS_API_KEY",
] as const;

declare global {
  var __andamusEnvChecked: boolean | undefined;
}

if (typeof window === "undefined" && !globalThis.__andamusEnvChecked) {
  globalThis.__andamusEnvChecked = true;
  const missing = requiredEnvVars.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    // During the Next.js build phase, env vars may not be available locally
    // but will be injected by Vercel at deploy time — warn only.
    // At runtime (actual requests), throw to fail fast.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(`[env] Missing environment variables at build time: ${missing.join(", ")}`);
    } else {
      throw new Error(
        `[env] Missing required environment variables: ${missing.join(", ")}. ` +
        `Check your .env.local file or Vercel environment settings.`
      );
    }
  }
}

export {};
