import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", port: "", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
    ],
  },

  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    const csp = [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.google.com https://*.gstatic.com https://www.googletagmanager.com https://*.googletagmanager.com https://browser.sentry-cdn.com"
        : "script-src 'self' 'unsafe-inline' https://apis.google.com https://*.google.com https://*.gstatic.com https://www.googletagmanager.com https://*.googletagmanager.com https://browser.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' blob: data: https://*.googleusercontent.com https://*.supabase.co https://images.unsplash.com https://*.openstreetmap.org https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.googleapis.com https://api.open-meteo.com wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
      "frame-src 'self' https://accounts.google.com https://*.google.com",
      "media-src 'self' https://*.supabase.co",
      "worker-src 'self' blob:",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self), interest-cohort=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },

  turbopack: {},
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

const composedConfig = withSerwist(withNextIntl(nextConfig));

export default withSentryConfig(composedConfig, {
  org: process.env.SENTRY_ORG || "pul-dz",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
