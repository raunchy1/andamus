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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase service role configuration. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
