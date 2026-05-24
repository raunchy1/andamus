import { NextResponse, type NextRequest } from "next/server";

const VALID_LOCALES = ["it", "en", "de"] as const;
type ValidLocale = (typeof VALID_LOCALES)[number];

const DEFAULT_LOCALE: ValidLocale = "it";

/**
 * Get the canonical app base URL from environment variables.
 * Falls back to production URL to prevent accidental localhost redirects in prod.
 */
export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://andamus.vercel.app";

  return url.replace(/\/$/, "");
}

/**
 * Validate that a redirect path is safe (internal-only, no open redirect).
 *
 * Rules:
 * - Must start with "/"
 * - Must NOT contain "://" or "//" at start (no external URLs)
 * - Must NOT start with "javascript:" (XSS)
 * - Must NOT contain null bytes
 * - Must either:
 *     a) be "/" or ""
 *     b) start with a valid locale (it/en/de)
 *     c) be a known locale-less internal path (/admin, /api/*, etc.)
 */
export function isSafeRedirectPath(path: string): boolean {
  if (!path || path === "/") return true;

  // Block protocol, host injection, javascript schemes, null bytes,
  // control characters, HTML tags, and path traversal
  if (
    path.includes("://") ||
    path.startsWith("//") ||
    path.toLowerCase().startsWith("javascript:") ||
    path.includes("\0") ||
    path.includes("\r") ||
    path.includes("\n") ||
    path.includes("\t") ||
    path.includes("<") ||
    path.includes(">") ||
    path.includes("..")
  ) {
    return false;
  }

  // Must start with "/"
  if (!path.startsWith("/")) return false;

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return true;

  const first = segments[0];

  // Valid locale prefix → allow any sub-path
  if (VALID_LOCALES.includes(first as ValidLocale)) {
    return true;
  }

  // Known internal paths that don't use locale prefix
  const localelessPrefixes = ["/admin", "/api", "/_next", "/coming-soon", "/offline", "/unsubscribe"];
  return localelessPrefixes.some((p) => path === p || path.startsWith(p + "/"));
}

/**
 * Build a safe, absolute redirect URL.
 *
 * @param path     The user-provided redirect path (e.g. from ?next=...)
 * @param locale   The target locale to prepend if the path lacks one
 * @param fallback Fallback path if the provided path is unsafe
 */
export function buildSafeRedirectUrl(
  path: string | null | undefined,
  locale: ValidLocale = DEFAULT_LOCALE,
  fallback: string = `/${DEFAULT_LOCALE}/profilo`
): string {
  const safePath = path && isSafeRedirectPath(path) ? path : fallback;

  // If the safe path lacks a locale prefix, prepend the default locale
  // (except for known locale-less paths like /admin)
  const segments = safePath.split("/").filter(Boolean);
  const hasLocale = segments.length > 0 && VALID_LOCALES.includes(segments[0] as ValidLocale);
  const isLocalelessInternal =
    segments.length > 0 &&
    ["admin", "api", "_next", "coming-soon", "offline", "unsubscribe"].includes(segments[0]);

  const finalPath = hasLocale || isLocalelessInternal ? safePath : `/${locale}${safePath}`;

  return getAppBaseUrl() + finalPath;
}

/* ────────────────────────────────────────────────────────────────── */
/*  OAuth STATE (CSRF protection)                                    */
/* ────────────────────────────────────────────────────────────────── */

const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_STATE_MAX_AGE = 600; // 10 minutes

/**
 * Generate a cryptographically secure random state string.
 */
export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Set the OAuth state cookie on a response.
 */
export function setOAuthStateCookie(response: NextResponse, state: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: OAUTH_STATE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear the OAuth state cookie.
 */
export function clearOAuthStateCookie(response: NextResponse): void {
  response.cookies.delete(OAUTH_STATE_COOKIE);
}

/**
 * Verify the OAuth state parameter from the query string against the cookie.
 *
 * @returns true if state matches, false otherwise
 */
export function verifyOAuthState(request: NextRequest): boolean {
  const url = new URL(request.url);
  const queryState = url.searchParams.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!queryState || !cookieState) return false;

  // Timing-safe comparison
  if (queryState.length !== cookieState.length) return false;

  let result = 0;
  for (let i = 0; i < queryState.length; i++) {
    result |= queryState.charCodeAt(i) ^ cookieState.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Extract the locale from a pathname like "/it/auth/callback" → "it"
 */
export function extractLocaleFromPathname(pathname: string): ValidLocale {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  return VALID_LOCALES.includes(first as ValidLocale) ? (first as ValidLocale) : DEFAULT_LOCALE;
}
