"use client";

import { onLCP, onINP, onCLS, onFCP, onTTFB, Metric } from "web-vitals";
import { captureEvent } from "./posthog";
import * as Sentry from "@sentry/nextjs";

type VitalName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";

function sendToAnalytics(metric: Metric, name: VitalName) {
  const value =
    name === "CLS" ? Math.round(metric.value * 1000) / 1000 : Math.round(metric.value);

  // PostHog
  captureEvent("web_vital", {
    vital_name: name,
    vital_value: value,
    vital_rating: metric.rating, // "good" | "needs-improvement" | "poor"
    vital_id: metric.id,
  });

  // Sentry
  Sentry.metrics?.distribution(`web_vital.${name.toLowerCase()}`, value, {
    unit: name === "CLS" ? "none" : "millisecond",
  });
}

export function reportWebVitals() {
  try {
    onLCP((m) => sendToAnalytics(m, "LCP"));
    onINP((m) => sendToAnalytics(m, "INP"));
    onCLS((m) => sendToAnalytics(m, "CLS"));
    onFCP((m) => sendToAnalytics(m, "FCP"));
    onTTFB((m) => sendToAnalytics(m, "TTFB"));
  } catch {
    // Vitals monitoring must never crash the app
  }
}
