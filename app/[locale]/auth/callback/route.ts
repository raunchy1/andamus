import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

const VALID_LOCALES = ["it", "en", "de"] as const;
type ValidLocale = (typeof VALID_LOCALES)[number];

function safeLocale(raw: string): ValidLocale {
  return VALID_LOCALES.includes(raw as ValidLocale) ? (raw as ValidLocale) : "it";
}

/**
 * OAuth / PKCE callback handler — server-side only.
 *
 * Why a Route Handler instead of a client component:
 * - The middleware calls updateSession() which refreshes the existing auth session
 *   and can inadvertently consume/clear the PKCE code-verifier cookie before the
 *   browser-side exchangeCodeForSession() has a chance to use it.
 * - A Route Handler runs before React rendering, reads the code + verifier from
 *   cookies atomically, and sets the new session cookies on the redirect response.
 * - This eliminates the race between middleware cookie management and client-side exchange.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale: rawLocale } = await params;
  const locale = safeLocale(rawLocale);

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const next = searchParams.get("next") ?? "";

  // ── Google / Supabase returned an error ──
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/${locale}/auth/auth-code-error?reason=oauth_error&error=${encodeURIComponent(oauthError)}`
    );
  }

  // ── No code in callback (direct navigation, bot, etc.) ──
  if (!code) {
    return NextResponse.redirect(
      `${origin}/${locale}/auth/auth-code-error?reason=missing_code`
    );
  }

  // ── Build the redirect response first so we can set cookies on it ──
  const safeNext =
    next && next.startsWith("/") && !next.includes("://") ? next : `/${locale}/profilo`;
  const successRedirect = NextResponse.redirect(`${origin}${safeNext}`);

  // ── Exchange PKCE code for session (server-side) ──
  const supabase = await createRouteHandlerClient(successRedirect);
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] PKCE exchange failed:", exchangeError.message);
    return NextResponse.redirect(
      `${origin}/${locale}/auth/auth-code-error?reason=exchange_failed&err=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // ── Session cookies are already set on successRedirect by setAll() ──
  return successRedirect;
}
