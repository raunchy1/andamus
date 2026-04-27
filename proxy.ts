import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware({
  locales: ["it", "en", "de"],
  defaultLocale: "it",
  localePrefix: "always",
});

export default async function proxy(request: NextRequest) {
  // 1. Update Supabase session (refreshes tokens, sets cookies)
  const supabaseResponse = await updateSession(request);

  // 2. If updateSession wants to redirect, respect it
  if (supabaseResponse.status !== 200) {
    return supabaseResponse;
  }

  // 3. Run next-intl middleware
  const intlResponse = intlMiddleware(request);

  // 4. Copy any Supabase auth cookies from supabaseResponse into intlResponse
  //    so the browser stays in sync with the server session.
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
