"use server";

/**
 * Performance Tracing
 * ===================
 * Lightweight request tracing without full OpenTelemetry overhead.
 * WHY: In serverless environments, heavy tracing libraries add cold-start
 * latency. This lightweight approach captures spans via structured logs.
 */

import { randomUUID } from "crypto";
import { logInfo, logError, logWarn } from "./logging";

// ---------------------------------------------------------------------------
// Span types
// ---------------------------------------------------------------------------

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, unknown>;
  status: "ok" | "error" | "cancelled";
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Active spans (in-memory, per-request)
// ---------------------------------------------------------------------------

const _activeSpans = new Map<string, Span>();
let _currentTraceId: string | undefined;

export function startTrace(name: string, attributes?: Record<string, unknown>): string {
  const traceId = randomUUID();
  _currentTraceId = traceId;

  const span: Span = {
    traceId,
    spanId: randomUUID(),
    name,
    startTime: performance.now(),
    attributes: attributes ?? {},
    status: "ok",
  };

  _activeSpans.set(span.spanId, span);
  return span.spanId;
}

export function startSpan(
  name: string,
  parentSpanId?: string,
  attributes?: Record<string, unknown>
): string {
  const traceId = _currentTraceId ?? randomUUID();
  const span: Span = {
    traceId,
    spanId: randomUUID(),
    parentSpanId,
    name,
    startTime: performance.now(),
    attributes: attributes ?? {},
    status: "ok",
  };

  _activeSpans.set(span.spanId, span);
  return span.spanId;
}

export function endSpan(spanId: string, status: "ok" | "error" | "cancelled" = "ok", errorMessage?: string): Span | undefined {
  const span = _activeSpans.get(spanId);
  if (!span) return undefined;

  span.endTime = performance.now();
  span.status = status;
  if (errorMessage) span.errorMessage = errorMessage;

  const durationMs = Math.round(span.endTime - span.startTime);

  // Log the span
  if (status === "error") {
    logError(`Span ${span.name} failed`, {
      metadata: {
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        durationMs,
        ...span.attributes,
        errorMessage,
      },
    });
  } else if (status === "cancelled") {
    logWarn(`Span ${span.name} cancelled`, {
      metadata: {
        traceId: span.traceId,
        spanId: span.spanId,
        durationMs,
        ...span.attributes,
      },
    });
  } else if (durationMs > 500) {
    // Log slow spans at info level
    logInfo(`Span ${span.name} completed`, {
      metadata: {
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        durationMs,
        ...span.attributes,
      },
    });
  }

  _activeSpans.delete(spanId);
  return span;
}

export function getSpan(spanId: string): Span | undefined {
  return _activeSpans.get(spanId);
}

export function setSpanAttribute(spanId: string, key: string, value: unknown): void {
  const span = _activeSpans.get(spanId);
  if (span) {
    span.attributes[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Trace wrapper for functions
// ---------------------------------------------------------------------------

export async function withTrace<T>(
  name: string,
  fn: (spanId: string) => Promise<T>,
  options?: { attributes?: Record<string, unknown>; parentSpanId?: string }
): Promise<T> {
  const spanId = startSpan(name, options?.parentSpanId, options?.attributes);

  try {
    const result = await fn(spanId);
    endSpan(spanId, "ok");
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    endSpan(spanId, "error", message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// API route tracing wrapper
// ---------------------------------------------------------------------------

export async function traceApiRoute<T>(
  routeName: string,
  fn: () => Promise<T>,
  options?: { userId?: string; metadata?: Record<string, unknown> }
): Promise<T> {
  const traceId = startTrace(routeName, {
    userId: options?.userId,
    ...options?.metadata,
  });

  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    logInfo(`API ${routeName} completed`, {
      metadata: { durationMs: duration, traceId },
    });

    return result;
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    logError(`API ${routeName} failed`, {
      metadata: { durationMs: duration, traceId },
      error: err instanceof Error ? err : new Error(message),
    });

    throw err;
  }
}
