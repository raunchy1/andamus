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

  if (!url) {
    throw new Error("Lipsește variabila de mediu NEXT_PUBLIC_SUPABASE_URL.");
  }

  // H-01 Fix: Fail-closed strict. Nu se permite rularea fără cheia admin service role în producție.
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIG: SUPABASE_SERVICE_ROLE_KEY lipsește în producție. " +
        "Operațiunile administrative sunt blocate."
      );
    } else {
      console.warn(
        "WARNING: SUPABASE_SERVICE_ROLE_KEY nu este configurat în mediul local. " +
        "Unele operațiuni de admin pot eșua."
      );
    }
  }

  return createClient(url, key || "dummy-key-for-build-step", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
