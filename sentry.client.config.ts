import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f17259d2b8187afe248315df705e8228@o4511178425827328.ingest.de.sentry.io/4511178427203664",
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration(),
  ],
});
