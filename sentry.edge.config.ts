import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://f17259d2b8187afe248315df705e8228@o4511178425827328.ingest.de.sentry.io/4511178427203664";

Sentry.init({
  dsn,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: false,

  // Scrub potentially sensitive headers in edge environment
  beforeSend(event) {
    if (event.request?.headers) {
      const scrubbed = { ...event.request.headers };
      const sensitive = ["authorization", "cookie", "x-api-key", "stripe-signature"];
      for (const key of Object.keys(scrubbed)) {
        if (sensitive.includes(key.toLowerCase())) {
          scrubbed[key] = "[REDACTED]";
        }
      }
      event.request.headers = scrubbed;
    }
    return event;
  },
});
