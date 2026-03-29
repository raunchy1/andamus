import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["it", "en", "de"],
  defaultLocale: "it",
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/",
    "/(it|en|de)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
