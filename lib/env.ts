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
    throw new Error(
      `[env] Missing required environment variables: ${missing.join(", ")}. ` +
      `Check your .env.local file or Vercel environment settings.`
    );
  }
}

export {};
