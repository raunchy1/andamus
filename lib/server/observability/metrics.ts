"use server";

/**
 * Custom Metrics
 * ==============
 * Lightweight metrics collection for business and technical KPIs.
 * WHY: Application metrics (DAU, bookings, latency) are essential
 * for operational awareness and capacity planning.
 */

import { getRedis } from "@/lib/redis";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// ---------------------------------------------------------------------------
// Metric types
// ---------------------------------------------------------------------------

export type MetricType = "counter" | "gauge" | "histogram" | "timer";

export interface MetricValue {
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// In-memory buffer (flushed periodically)
// ---------------------------------------------------------------------------

const _metricBuffer: MetricValue[] = [];
const BUFFER_FLUSH_SIZE = 100;
const BUFFER_MAX_AGE_MS = 30000; // 30 seconds

let _lastFlush = Date.now();

// ---------------------------------------------------------------------------
// Record metrics
// ---------------------------------------------------------------------------

export function recordCounter(
  name: string,
  increment = 1,
  labels: Record<string, string> = {}
): void {
  _metricBuffer.push({
    name,
    type: "counter",
    value: increment,
    labels,
    timestamp: Date.now(),
  });

  checkFlush();
}

export function recordGauge(
  name: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  _metricBuffer.push({
    name,
    type: "gauge",
    value,
    labels,
    timestamp: Date.now(),
  });

  checkFlush();
}

export function recordTimer(
  name: string,
  durationMs: number,
  labels: Record<string, string> = {}
): void {
  _metricBuffer.push({
    name,
    type: "timer",
    value: durationMs,
    labels,
    timestamp: Date.now(),
  });

  checkFlush();
}

export function recordHistogram(
  name: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  _metricBuffer.push({
    name,
    type: "histogram",
    value,
    labels,
    timestamp: Date.now(),
  });

  checkFlush();
}

// ---------------------------------------------------------------------------
// Business metrics helpers
// ---------------------------------------------------------------------------

export function recordBookingCreated(bookingId: string, rideId: string): void {
  recordCounter("bookings_created_total", 1, { ride_id: rideId });
}

export function recordBookingConfirmed(bookingId: string, amount?: number): void {
  recordCounter("bookings_confirmed_total", 1);
  if (amount !== undefined) {
    recordGauge("booking_value_eur", amount);
  }
}

export function recordBookingCancelled(reason?: string): void {
  recordCounter("bookings_cancelled_total", 1, { reason: reason ?? "unknown" });
}

export function recordRideCreated(rideId: string, fromCity: string, toCity: string): void {
  recordCounter("rides_created_total", 1, { from_city: fromCity, to_city: toCity });
}

export function recordRideSearch(latencyMs: number, resultCount: number): void {
  recordTimer("ride_search_latency_ms", latencyMs);
  recordGauge("ride_search_results_count", resultCount);
}

export function recordUserSignup(source?: string): void {
  recordCounter("users_signup_total", 1, { source: source ?? "organic" });
}

export function recordPushNotificationDelivered(channel: string): void {
  recordCounter("push_notifications_delivered_total", 1, { channel });
}

export function recordPushNotificationFailed(channel: string, errorType: string): void {
  recordCounter("push_notifications_failed_total", 1, { channel, error_type: errorType });
}

export function recordPaymentProcessed(amount: number, currency: string): void {
  recordCounter("payments_processed_total", 1, { currency });
  recordGauge("payment_amount", amount, { currency });
}

export function recordPaymentFailed(failureReason: string): void {
  recordCounter("payments_failed_total", 1, { reason: failureReason });
}

export function recordApiLatency(endpoint: string, method: string, latencyMs: number, statusCode: number): void {
  recordTimer("api_latency_ms", latencyMs, { endpoint, method, status: String(statusCode) });
  recordCounter("api_requests_total", 1, { endpoint, method, status: String(statusCode) });
}

export function recordDbQueryLatency(table: string, operation: string, latencyMs: number): void {
  recordTimer("db_query_latency_ms", latencyMs, { table, operation });
}

export function recordCacheHit(keyPattern: string): void {
  recordCounter("cache_hits_total", 1, { pattern: keyPattern });
}

export function recordCacheMiss(keyPattern: string): void {
  recordCounter("cache_misses_total", 1, { pattern: keyPattern });
}

export function recordWebsocketConnection(event: "connect" | "disconnect" | "error"): void {
  recordCounter("websocket_connections_total", 1, { event });
}

export function recordQueueDepth(queueName: string, depth: number): void {
  recordGauge("queue_depth", depth, { queue: queueName });
}

export function recordModerationAction(action: string): void {
  recordCounter("moderation_actions_total", 1, { action });
}

export function recordSafetyAlert(alertType: string): void {
  recordCounter("safety_alerts_total", 1, { alert_type: alertType });
}

// ---------------------------------------------------------------------------
// Flush logic
// ---------------------------------------------------------------------------

function checkFlush(): void {
  const shouldFlush =
    _metricBuffer.length >= BUFFER_FLUSH_SIZE ||
    Date.now() - _lastFlush > BUFFER_MAX_AGE_MS;

  if (shouldFlush) {
    flushMetrics().catch(() => {
      // Silently fail metrics — don't break user requests
    });
  }
}

async function flushMetrics(): Promise<void> {
  if (_metricBuffer.length === 0) return;

  const toFlush = _metricBuffer.splice(0, _metricBuffer.length);
  _lastFlush = Date.now();

  // Write to Redis time-series for aggregation
  const redis = getRedis();
  if (redis) {
    try {
      const pipeline = redis.pipeline();
      const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH

      for (const metric of toFlush) {
        const key = `metrics:${hour}:${metric.name}`;
        pipeline.lpush(key, JSON.stringify(metric));
        pipeline.expire(key, 86400 * 2); // 2 days
      }

      await pipeline.exec();
    } catch {
      // Redis unavailable — drop metrics
    }
  }

  // Also write critical business metrics to Supabase for persistence
  try {
    const supabase = await createServiceRoleClient();
    const businessMetrics = toFlush.filter((m) =>
      m.name.startsWith("bookings_") ||
      m.name.startsWith("rides_") ||
      m.name.startsWith("users_") ||
      m.name.startsWith("payments_")
    );

    if (businessMetrics.length > 0) {
      await supabase.from("hourly_metrics").insert(
        businessMetrics.map((m) => ({
          hour: new Date(m.timestamp).toISOString(),
          endpoint: m.name,
          requests: Math.round(m.value),
          // Note: Supabase hourly_metrics schema is simple; we store
          // rich metrics in Redis and basic counts in the DB
        }))
      );
    }
  } catch {
    // DB write is best-effort for metrics
  }
}

// ---------------------------------------------------------------------------
// Metrics retrieval (for dashboards)
// ---------------------------------------------------------------------------

export async function getMetricsForHour(
  hour: string,
  nameFilter?: string
): Promise<MetricValue[]> {
  const redis = getRedis();
  if (!redis) return [];

  try {
    const pattern = `metrics:${hour}:*${nameFilter ?? ""}*`;
    const keys = await redis.keys(pattern);
    const metrics: MetricValue[] = [];

    for (const key of keys) {
      const values = await redis.lrange(key as string, 0, 999);
      for (const val of values) {
        try {
          metrics.push(JSON.parse(val as string) as MetricValue);
        } catch {
          // Skip invalid
        }
      }
    }

    return metrics;
  } catch {
    return [];
  }
}
