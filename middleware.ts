import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware({
  locales: ["it", "en", "de"],
  defaultLocale: "it",
  localePrefix: "always",
});

const ADMIN_EMAIL = "cristiermurache@gmail.com";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Create Supabase server client for session + admin check
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 2. Admin route protection
  if (pathname.includes("/admin")) {
    if (!user || user.email !== ADMIN_EMAIL) {
      const locale = pathname.split("/")[1] || "it";
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // 3. Run next-intl middleware
  const intlResponse = intlMiddleware(request);

  // 4. Copy any Supabase auth cookies from response into intlResponse
  response.cookies.getAll().forEach((cookie) => {
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
