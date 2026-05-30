/**
 * Service-role Supabase client — bypasses RLS.
 *
 * ⚠️ SECURITY: Only use in server-side code (API routes, Server Actions).
 * Never expose this client or the service role key to the browser.
 */

import { createClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createServiceRoleClient() must never be called in the browser. " +
        "This is a critical security violation."
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.warn("WARNING: NEXT_PUBLIC_SUPABASE_URL is missing. Returning placeholder client.");
    return createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  if (!key) {
    console.warn(
      "WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. " +
        "Falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY to prevent Server Component crashes."
    );
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
