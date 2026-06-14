import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  buildSafeRedirectUrl,
  verifyOAuthState,
  clearOAuthStateCookie,
  getAppBaseUrl,
} from "@/lib/server/actions/auth";

const VALID_LOCALES = ["it", "en", "de"] as const;
type ValidLocale = (typeof VALID_LOCALES)[number];

function getSafeLocale(request: NextRequest, nextPath?: string | null): ValidLocale {
  if (nextPath) {
    const parts = nextPath.split("/");
    const firstPart = parts[1];
    if (VALID_LOCALES.includes(firstPart as ValidLocale)) {
      return firstPart as ValidLocale;
    }
  }

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && VALID_LOCALES.includes(cookieLocale as ValidLocale)) {
    return cookieLocale as ValidLocale;
  }

  return "it";
}

function redirectToError(
  locale: ValidLocale,
  reason: string,
  error?: string
): NextResponse {
  const url = new URL(`/${locale}/auth/auth-code-error`, getAppBaseUrl());
  url.searchParams.set("reason", reason);
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url.toString());
  clearOAuthStateCookie(response);
  return response;
}

/**
 * Centralized OAuth / PKCE Callback Route Handler.
 * Located at: /app/auth/callback/route.ts
 *
 * Security:
 * - Uses fixed NEXT_PUBLIC_APP_URL base (never request.url / X-Forwarded-Host).
 * - Validates redirect paths via isSafeRedirectPath whitelist.
 * - Verifies OAuth state cookie when state param is present (Google OAuth CSRF).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const next = url.searchParams.get("next");
  const stateParam = url.searchParams.get("state");

  const locale = getSafeLocale(request, next);

  logger.info("[auth/callback] OAuth callback request received", {
    hasCode: !!code,
    oauthError,
    nextParam: next,
    hasState: !!stateParam,
    detectedLocale: locale,
  });

  if (stateParam) {
    if (!verifyOAuthState(request)) {
      logger.warn("[auth/callback] OAuth state mismatch — possible CSRF");
      return redirectToError(locale, "invalid_state");
    }
  }

  if (oauthError) {
    logger.error("[auth/callback] Google OAuth error returned", { oauthError });
    return redirectToError(locale, "oauth_error", oauthError);
  }

  if (!code) {
    logger.warn("[auth/callback] Missing authorization code in callback");
    return redirectToError(locale, "missing_code");
  }

  const safeRedirectUrl = buildSafeRedirectUrl(next, locale);
  const successRedirect = NextResponse.redirect(safeRedirectUrl);

  try {
    const supabase = await createRouteHandlerClient(successRedirect);

    logger.info("[auth/callback] Starting PKCE code-verifier exchange...");
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      logger.error("[auth/callback] PKCE code exchange failed", {
        message: exchangeError.message,
      });
      return redirectToError(locale, "exchange_failed", exchangeError.message);
    }

    clearOAuthStateCookie(successRedirect);

    logger.info("[auth/callback] Session exchange completed successfully", {
      targetRedirect: safeRedirectUrl,
    });

    return successRedirect;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected server error";
    logger.error("[auth/callback] Exception caught during PKCE exchange", { error: errorMsg });
    return redirectToError(locale, "server_exception", errorMsg);
  }
}