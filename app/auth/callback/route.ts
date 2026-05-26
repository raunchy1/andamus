import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const VALID_LOCALES = ["it", "en", "de"] as const;
type ValidLocale = (typeof VALID_LOCALES)[number];

function getSafeLocale(request: NextRequest, nextPath?: string | null): ValidLocale {
  // 1. Try to extract from the next path (e.g. /it/profilo)
  if (nextPath) {
    const parts = nextPath.split("/");
    const firstPart = parts[1];
    if (VALID_LOCALES.includes(firstPart as ValidLocale)) {
      return firstPart as ValidLocale;
    }
  }

  // 2. Try to read from the next-intl persistent cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && VALID_LOCALES.includes(cookieLocale as ValidLocale)) {
    return cookieLocale as ValidLocale;
  }

  return "it"; // Default fallback
}

/**
 * Centralized OAuth / PKCE Callback Route Handler.
 * Located at: /app/auth/callback/route.ts
 *
 * Why this is production-grade:
 * - Runs at the root level (/auth/callback) to avoid i18n redirect loops.
 * - Prevents PKCE verifier cookie race conditions by bypassing session updates in middleware.
 * - Dynamically restores user locale and redirects safely back to the original page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const next = searchParams.get("next");

  const locale = getSafeLocale(request, next);

  logger.info("[auth/callback] OAuth callback request received", {
    hasCode: !!code,
    oauthError,
    nextParam: next,
    detectedLocale: locale,
  });

  // ── 1. Google / Supabase returned an OAuth error ──
  if (oauthError) {
    logger.error("[auth/callback] Google OAuth error returned", { oauthError });
    return NextResponse.redirect(
      `${origin}/${locale}/auth/auth-code-error?reason=oauth_error&error=${encodeURIComponent(oauthError)}`
    );
  }

  // ── 2. No code found in callback search parameters ──
  if (!code) {
    logger.warn("[auth/callback] Missing authorization code in callback");
    return NextResponse.redirect(
      `${origin}/${locale}/auth/auth-code-error?reason=missing_code`
    );
  }

  // ── 3. Build target redirect path and response ──
  // Ensure the target is local and cannot be used for open redirect exploits
  const safeNext = next && next.startsWith("/") && !next.includes("://") 
    ? next 
    : `/${locale}/profilo`;

  const successRedirect = NextResponse.redirect(`${origin}${safeNext}`);

  // ── 4. Exchange PKCE code for session server-side ──
  try {
    const supabase = await createRouteHandlerClient(successRedirect);
    
    logger.info("[auth/callback] Starting PKCE code-verifier exchange...");
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      logger.error("[auth/callback] PKCE code exchange failed", {
        message: exchangeError.message,
      });
      return NextResponse.redirect(
        `${origin}/${locale}/auth/auth-code-error?reason=exchange_failed&error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    logger.info("[auth/callback] Session exchange completed successfully", {
      targetRedirect: safeNext,
    });

    // Session cookies are populated on the successRedirect headers by setAll() in Supabase Route Handler client
    return successRedirect;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected server error";
    logger.error("[auth/callback] Exception caught during PKCE exchange", { error: errorMsg });
    return NextResponse.redirect(
      `${origin}/${locale}/auth/auth-code-error?reason=server_exception&error=${encodeURIComponent(errorMsg)}`
    );
  }
}
