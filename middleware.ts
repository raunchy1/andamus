import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/admin-config";

const intlMiddleware = createMiddleware({
  locales: ["it", "en", "de"],
  defaultLocale: "it",
  localePrefix: "always",
});

// Matches /admin or /{locale}/admin (and nested), but NOT /admin-anything-else
const ADMIN_PATH_REGEX = /^\/(?:it|en|de)\/admin(?:\/|$)|^\/admin(?:\/|$)/;

// WAITLIST_MODE controls whether the app is gated behind coming-soon.
// When false (default), the full app is publicly accessible.
const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";
// Matches /, /it, /it/, /en, /en/, /de, /de/
const LOCALE_ROOT_REGEX = /^\/(?:it|en|de)?\/?$/;
// Paths that bypass the coming-soon redirect (internal testing + auth access)
const COMING_SOON_BYPASS = ["/dashboard", "/admin", "/login", "/it/join", "/en/join", "/de/join", "/it/admin", "/en/admin", "/de/admin", "/it/auth", "/en/auth", "/de/auth", "/it/verifica", "/en/verifica", "/de/verifica", "/it/profilo", "/en/profilo", "/de/profilo", "/it/corsa", "/en/corsa", "/de/corsa", "/it/offri", "/en/offri", "/de/offri", "/it/cerca", "/en/cerca", "/de/cerca", "/it/premium", "/en/premium", "/de/premium"];

// Detect Supabase auth cookies — only refresh session if user is actually signed in.
// Skipping the Supabase round-trip for anonymous visitors keeps cold-start latency
// well under Vercel's middleware timeout (was causing MIDDLEWARE_INVOCATION_TIMEOUT).
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) return true;
  }
  return false;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // When waitlist mode is OFF, redirect /coming-soon to home
  if (!WAITLIST_MODE && pathname === "/coming-soon") {
    return NextResponse.redirect(new URL("/it", request.url));
  }

  // When waitlist mode is ON, redirect anonymous visitors to /coming-soon
  // Logged-in users (have Supabase auth cookie) bypass the redirect entirely
  if (WAITLIST_MODE && !hasSupabaseAuthCookie(request)) {
    const isBypass = COMING_SOON_BYPASS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (!isBypass && LOCALE_ROOT_REGEX.test(pathname)) {
      return NextResponse.redirect(new URL("/coming-soon", request.url));
    }
  }

  const isAdminPath = ADMIN_PATH_REGEX.test(pathname);
  const needsSupabase = isAdminPath || hasSupabaseAuthCookie(request);

  // 1. Update Supabase session — only when needed (admin routes or signed-in users).
  //    Anonymous visitors skip this to avoid cold-start middleware timeouts.
  const supabaseResponse = needsSupabase
    ? await updateSession(request)
    : NextResponse.next({ request });

  // 2. Admin route protection — strict path matching.
  //    IMPORTANT: use the cookies from supabaseResponse (which may contain a freshly
  //    rotated token) rather than reading from request.cookies directly.
  if (isAdminPath) {
    // Build a merged cookie map: start from the original request cookies, then
    // overlay any new cookies written by updateSession so the admin check always
    // uses the most up-to-date token.
    const cookieMap = new Map<string, string>(
      request.cookies.getAll().map((c) => [c.name, c.value] as [string, string])
    );
    supabaseResponse.cookies.getAll().forEach((c) => {
      cookieMap.set(c.name, c.value);
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }));
          },
          setAll() {
            // no-op — updateSession already handled cookie refresh
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!isAdmin(user?.email)) {
      const locale = pathname.split("/")[1] || "it";
      const redirect = NextResponse.redirect(new URL("/" + locale, request.url));
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          maxAge: cookie.maxAge,
          domain: cookie.domain,
          path: cookie.path,
          sameSite: cookie.sameSite as "strict" | "lax" | "none" | undefined,
          secure: cookie.secure,
        });
      });
      return redirect;
    }
  }

  // 3. Run next-intl middleware
  const intlResponse = intlMiddleware(request);

  // 4. Copy any Supabase auth cookies from supabaseResponse into intlResponse
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
      domain: cookie.domain,
      path: cookie.path,
      sameSite: cookie.sameSite as "strict" | "lax" | "none" | undefined,
      secure: cookie.secure,
    });
  });

  return intlResponse;
}

export const config = {
  matcher: [
    "/",
    "/(it|en|de)/:path*",
    "/((?!api|_next|_vercel|monitoring|sw\.js|manifest\.json|offline|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|css|js|map|txt|xml)$).*)",
  ],
};
