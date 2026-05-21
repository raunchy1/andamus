import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/features";
import {
  buildSafeRedirectUrl,
  verifyOAuthState,
  clearOAuthStateCookie,
  extractLocaleFromPathname,
} from "@/lib/auth-helpers";

/**
 * Hardened OAuth callback handler.
 *
 * SECURITY FIXES APPLIED:
 * - State parameter verified against httpOnly cookie (CSRF protection)
 * - Redirects validated against whitelist (open redirect fix)
 * - Fixed base URL from env vars — NEVER uses request.url or X-Forwarded-Host
 * - Safe error handling — no internal error leakage
 * - Automatic OAuth state cookie cleanup
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = extractLocaleFromPathname(request.nextUrl.pathname);

  // ── 1. Handle OAuth provider errors ─────────────────────────────
  const oauthError = searchParams.get("error");
  if (oauthError) {
    const description = searchParams.get("error_description") ?? oauthError;
    console.error("[auth/callback] OAuth provider error:", { oauthError, description });

    const errorUrl = buildSafeRedirectUrl(`/${locale}/auth/auth-code-error`, locale);
    const response = NextResponse.redirect(errorUrl);
    clearOAuthStateCookie(response);
    return response;
  }

  // ── 2. Verify OAuth state (CSRF protection) ─────────────────────
  if (!verifyOAuthState(request)) {
    console.error("[auth/callback] OAuth state mismatch or missing — possible CSRF attack");
    const errorUrl = buildSafeRedirectUrl(`/${locale}/auth/auth-code-error`, locale);
    const response = NextResponse.redirect(errorUrl);
    clearOAuthStateCookie(response);
    return response;
  }

  // ── 3. Exchange code for session ────────────────────────────────
  if (!code) {
    console.error("[auth/callback] Missing authorization code");
    const errorUrl = buildSafeRedirectUrl(`/${locale}/auth/auth-code-error`, locale);
    const response = NextResponse.redirect(errorUrl);
    clearOAuthStateCookie(response);
    return response;
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    console.error("[auth/callback] Session exchange failed:", error?.message);
    const errorUrl = buildSafeRedirectUrl(`/${locale}/auth/auth-code-error`, locale);
    const response = NextResponse.redirect(errorUrl);
    clearOAuthStateCookie(response);
    return response;
  }

  // ── 4. Apply referral bonus if present ──────────────────────────
  const cookieHeader = request.headers.get("cookie");
  const pendingRefMatch = cookieHeader?.match(/pending_referral_code=([^;]+)/);
  const pendingRefCode = pendingRefMatch ? decodeURIComponent(pendingRefMatch[1]) : null;

  if (pendingRefCode) {
    try {
      await supabase.rpc("apply_referral_bonus", {
        new_user_id: user.id,
        referrer_code: pendingRefCode,
      });
    } catch (err) {
      console.error("[auth/callback] Referral bonus failed:", err);
      // Non-fatal — don't block login
    }
  }

  // ── 5. Send welcome email for new users ─────────────────────────
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, created_at")
    .eq("id", user.id)
    .single();

  const isNewUser = !existingProfile || (
    existingProfile.created_at &&
    new Date(existingProfile.created_at).getTime() > Date.now() - 60000
  );

  if (isNewUser) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://andamus.it"}/api/emails/welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (err) {
      console.error("[auth/callback] welcome email failed (non-fatal):", err);
    }
  }

  // ── 6. Check if user has a profile ──────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  const nextPath = searchParams.get("next");
  const fallbackPath = profile
    ? `/${locale}/profilo`
    : FEATURES.WAITLIST_MODE
      ? `/${locale}/lansare`
      : `/${locale}/profilo`;

  const redirectUrl = buildSafeRedirectUrl(nextPath, locale, fallbackPath);

  const response = NextResponse.redirect(redirectUrl);

  // ── 6. Cleanup cookies ──────────────────────────────────────────
  clearOAuthStateCookie(response);
  response.cookies.delete("pending_referral_code");

  return response;
}
