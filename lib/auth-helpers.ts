/**
 * Auth security helpers — safe redirect validation and OAuth state management.
 *
 * SECURITY PRINCIPLES:
 * - NEVER trust user-controlled URLs for redirects.
 * - ONLY allow internal app paths with valid locale prefixes.
 * - ALWAYS validate the OAuth state parameter against a server-set cookie.
 * - NEVER use request.url or X-Forwarded-Host as a redirect base.
 *
 * @deprecated Import directly from `@/lib/server/actions/auth` for server-side code.
 */

export {
  getAppBaseUrl,
  isSafeRedirectPath,
  buildSafeRedirectUrl,
  generateOAuthState,
  setOAuthStateCookie,
  clearOAuthStateCookie,
  verifyOAuthState,
  extractLocaleFromPathname,
} from "@/lib/server/actions/auth";
