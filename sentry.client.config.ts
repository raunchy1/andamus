import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://f17259d2b8187afe248315df705e8228@o4511178425827328.ingest.de.sentry.io/4511178427203664";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development",
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,

  // Tracing
  tracesSampleRate: isProd ? 0.1 : 1.0,

  // Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: isProd ? 0.05 : 0.1,

  // Ignore noisy browser extensions and known non-errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error exception captured",
    "Non-Error promise rejection captured",
    "Cannot read properties of undefined (reading 'find')", // extension noise
    "window.ethereum is not available", // MetaMask noise
    "chrome-extension",
    "moz-extension",
    "web3 is not defined",
    "Extension context invalidated",
  ],
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
  ],

  beforeSend(event) {
    // Filter out known non-actionable errors
    if (event.exception?.values?.some((e) =>
      e.stacktrace?.frames?.some((f) =>
        f.filename?.includes("gtm.js") ||
        f.filename?.includes("analytics.js") ||
        f.filename?.includes("facebook.net") ||
        f.filename?.includes("google-analytics")
      )
    )) {
      return null;
    }
    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      // Mask sensitive input fields
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: true,
      // Unmask specific non-sensitive areas
      unmask: ["[data-sentry-unmask]"],
      // Network details
      networkDetailAllowUrls: [window.location.origin],
      networkCaptureBodies: false, // Never capture request/response bodies
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Attach stack traces for better debugging
  attachStacktrace: true,

  // Normalize depth for deeply nested objects
  normalizeDepth: 5,
});
