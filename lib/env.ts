/**
 * Centralized environment variable validation.
 * Uses Zod for runtime type safety. Fails fast on missing critical variables.
 * Safe to import from both server and client contexts.
 */

import { z } from "zod";

const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),

  // VAPID (Push notifications)
  VAPID_PUBLIC_KEY: z.string().min(1, "VAPID_PUBLIC_KEY is required").optional(),
  VAPID_PRIVATE_KEY: z.string().min(1, "VAPID_PRIVATE_KEY is required").optional(),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Cron
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),

  // Admin (comma-separated emails)
  ADMIN_EMAILS: z.string().optional(),
  NEXT_PUBLIC_ADMIN_EMAILS: z.string().optional(),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://andamus.app"),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),

  // Third-party
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1, "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is required"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),

  // Observability
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Waitlist
  NEXT_PUBLIC_WAITLIST_MODE: z.enum(["true", "false"]).default("false"),

  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const clientEnvSchema = serverEnvSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
  NEXT_PUBLIC_BASE_URL: true,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: true,
  NEXT_PUBLIC_WAITLIST_MODE: true,
  NEXT_PUBLIC_ADMIN_EMAILS: true,
  NEXT_PUBLIC_SENTRY_DSN: true,
  NEXT_PUBLIC_POSTHOG_KEY: true,
  NEXT_PUBLIC_POSTHOG_HOST: true,
  NODE_ENV: true,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

let _serverEnv: ServerEnv | undefined;
let _clientEnv: ClientEnv | undefined;

function parseServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("parseServerEnv() must only be called on the server.");
  }
  if (_serverEnv) return _serverEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`[ENV] Invalid environment variables: ${issues}`);
  }

  _serverEnv = parsed.data;
  return _serverEnv;
}

function parseClientEnv(): ClientEnv {
  if (_clientEnv) return _clientEnv;

  const parsed = clientEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`[ENV] Invalid client environment variables: ${issues}`);
  }

  _clientEnv = parsed.data;
  return _clientEnv;
}

/**
 * Server-only environment variables. Throws if called on the client.
 */
export function env(): ServerEnv {
  return parseServerEnv();
}

/**
 * Client-safe environment variables. Works in both server and browser.
 */
export function clientEnv(): ClientEnv {
  return parseClientEnv();
}

/**
 * Typed accessor for server env. Alias for `env()`.
 */
export function getServerEnv(): ServerEnv {
  return env();
}
