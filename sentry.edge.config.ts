import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://f17259d2b8187afe248315df705e8228@o4511178425827328.ingest.de.sentry.io/4511178427203664";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn,
  tracesSampleRate: isProd ? 0.1 : 1.0,
  debug: false,
});
