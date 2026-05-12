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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Update Supabase session (refreshes tokens, sets cookies)
  const supabaseResponse = await updateSession(request);

  // 2. If updateSession wants to redirect, respect it
  if (supabaseResponse.status !== 200) {
    return supabaseResponse;
  }

  // 3. Admin route protection — strict path matching
  if (ADMIN_PATH_REGEX.test(pathname)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
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
      const redirect = NextResponse.redirect(new URL(`/${locale}`, request.url));
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

  // 4. Run next-intl middleware
  const intlResponse = intlMiddleware(request);

  // 5. Copy any Supabase auth cookies from supabaseResponse into intlResponse
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
    "/((?!api|_next|_vercel|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
