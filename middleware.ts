import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// Note: updateSession from @/lib/supabase/middleware is NOT used here.
// The middleware creates its own Supabase client inline for cookie management.
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/server/guards/admin";

const intlMiddleware = createMiddleware({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "always",
});

const ADMIN_PAGE_REGEX = /^\/(?:it|en)\/admin(?:\/|$)|^\/admin(?:\/|$)/;
const ADMIN_API_REGEX = /^\/api\/admin(?:\/|$)/;
const PUSH_API_REGEX = /^\/api\/push(?:\/|$)/;
// Auth callback must bypass updateSession and intlMiddleware — the Route Handler
// exchanges the PKCE code server-side; any middleware cookie mutation before that
// would consume or invalidate the code-verifier cookie.
const AUTH_CALLBACK_REGEX = /^\/auth\/callback(\/|$)/;

const WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";
const LOCALE_ROOT_REGEX = /^\/(?:it|en)?\/?$/;

const COMING_SOON_BYPASS = [
  "/dashboard", "/admin", "/login",
  "/it/join", "/en/join",
  "/it/admin", "/en/admin",
  "/it/auth", "/en/auth",
  "/it/verifica", "/en/verifica",
  "/it/profilo", "/en/profilo",
  "/it/corsa", "/en/corsa",
  "/it/offri", "/en/offri",
  "/it/cerca", "/en/cerca",
  "/it/premium", "/en/premium",
];

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) return true;
  }
  return false;
}

function jsonError(message: string, code: string, status: number): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = ADMIN_PAGE_REGEX.test(pathname);
  const isAdminApi = ADMIN_API_REGEX.test(pathname);
  const isPushApi = PUSH_API_REGEX.test(pathname);
  const needsAuthCheck = isAdminPage || isAdminApi || isPushApi;

  // ── 1. Waitlist mode redirects ──
  if (!WAITLIST_MODE && pathname === "/coming-soon") {
    return NextResponse.redirect(new URL("/it", request.url));
  }

  if (WAITLIST_MODE && !hasSupabaseAuthCookie(request)) {
    const isBypass = COMING_SOON_BYPASS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (!isBypass && LOCALE_ROOT_REGEX.test(pathname)) {
      return NextResponse.redirect(new URL("/coming-soon", request.url));
    }
  }

  // ── 2. Auth callback fast-path ──
  if (AUTH_CALLBACK_REGEX.test(pathname)) {
    const response = NextResponse.next({ request });
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  const needsSupabase = needsAuthCheck || hasSupabaseAuthCookie(request);

  // ── 3. Supabase session refresh & User retrieval (ONE CALL) ──
  let supabaseResponse = NextResponse.next({ request });
  let user: import("@supabase/supabase-js").User | null = null;

  if (needsSupabase) {
    // We use a dedicated client for the middleware to manage cookies correctly
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }

  // ── 4. API route protection ──
  if (isAdminApi || isPushApi) {
    if (!user?.id) {
      return jsonError("Authentication required", "UNAUTHORIZED", 401);
    }

    if (isAdminApi) {
      const userIsAdmin = await isAdmin(user.id, user.email);
      if (!userIsAdmin) {
        return jsonError("Admin access required", "FORBIDDEN", 403);
      }
    }
    // Push API: authenticated user is sufficient
    return supabaseResponse;
  }

  // ── 5. Admin page protection ──
  if (isAdminPage) {
    const userIsAdmin = user?.id ? await isAdmin(user.id, user.email) : false;

    if (!userIsAdmin) {
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

  // ── 5.5. Onboarding flow check ──
  if (user && !pathname.startsWith("/api/") && !AUTH_CALLBACK_REGEX.test(pathname)) {
    try {
      // Create a temporary client for DB check (not auth) to avoid extragetUser
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {},
          },
        }
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      const localeMatch = pathname.match(/^\/(it|en)(?:\/|$)/);
      const currentLocale = localeMatch ? localeMatch[1] : "it";
      const isOnboardingPage = /^\/(?:it|en|de)?\/onboarding(?:\/|$)/.test(pathname);

      if (profile && !profile.onboarding_completed) {
        if (!isOnboardingPage) {
          const redirect = NextResponse.redirect(new URL(`/${currentLocale}/onboarding`, request.url));
          supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value, c));
          return redirect;
        }
      } else if (profile && profile.onboarding_completed) {
        if (isOnboardingPage) {
          const redirect = NextResponse.redirect(new URL(`/${currentLocale}`, request.url));
          supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value, c));
          return redirect;
        }
      }
    } catch (onboardingErr) {
      console.error("[middleware] Onboarding check failed:", onboardingErr);
    }
  }

  // ── 6. Referral code capture ──
  const refCode = request.nextUrl.searchParams.get("ref");
  if (refCode && /^[A-Z0-9-]+$/i.test(refCode)) {
    const safeRef = encodeURIComponent(refCode.slice(0, 50));
    supabaseResponse.cookies.set("pending_referral_code", safeRef, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  // ── 7. Security headers ──
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=(self)");

  // Pass the current pathname to the root layout so it can set <html lang> dynamically (CRIT-09)
  request.headers.set("x-next-url", pathname);

  // ── 8. next-intl locale routing (skip for API routes) ──
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  const intlResponse = intlMiddleware(request);

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

  ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"].forEach((h) => {
    const value = supabaseResponse.headers.get(h);
    if (value) intlResponse.headers.set(h, value);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    "/",
    "/(it|en)/:path*",
    "/api/admin/:path*",
    "/api/push/:path*",
    "/((?!api|_next|_vercel|monitoring|sw\.js|manifest\.json|offline|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|css|js|map|txt|xml)$).*)",
  ],
};
