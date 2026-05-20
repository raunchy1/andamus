import { NextResponse } from "next/server";
import { generateOAuthState, setOAuthStateCookie } from "@/lib/auth-helpers";

/**
 * Generate and store an OAuth state parameter for CSRF protection.
 *
 * Flow:
 * 1. Client calls this endpoint before initiating OAuth.
 * 2. Server generates a random state, stores it in an httpOnly cookie.
 * 3. Client passes the state to supabase.auth.signInWithOAuth().
 * 4. OAuth provider returns state in the callback query string.
 * 5. Callback route verifies state against the cookie.
 */
export async function POST() {
  const state = generateOAuthState();
  const response = NextResponse.json({ state });
  setOAuthStateCookie(response, state);
  return response;
}
