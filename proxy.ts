import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["it", "en", "de"],
  defaultLocale: "it",
  localePrefix: "always",
});

export default function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(it|en|de)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
