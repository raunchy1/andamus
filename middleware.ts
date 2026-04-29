import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware({
  locales: ["it", "en", "de"],
  defaultLocale: "it",
  localePrefix: "always",
});

const ADMIN_EMAIL = "cristiermurache@gmail.com";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Update Supabase session (refreshes tokens, sets cookies)
  const supabaseResponse = await updateSession(request);

  // 2. If updateSession wants to redirect, respect it
  if (supabaseResponse.status !== 200) {
    return supabaseResponse;
  }

  // 3. Admin route protection — read user from the already-refreshed session
  if (pathname.includes("/admin")) {
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

    if (!user || user.email !== ADMIN_EMAIL) {
      const locale = pathname.split("/")[1] || "it";
      const redirect = NextResponse.redirect(new URL(`/${locale}`, request.url));
      // Copy Supabase cookies to redirect response so session stays in sync
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
