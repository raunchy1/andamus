// Environment variable validation — server-side only
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "STRIPE_SECRET_KEY",
  "GOOGLE_MAPS_API_KEY",
] as const;

if (typeof window === "undefined") {
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      console.warn(`[env] Missing environment variable: ${key}`);
    }
  }
}

export {};
