// @ts-nocheck
import "server-only";

/**
 * Structured Logging
 * ==================
 * Production-safe, GDPR-aware structured logging with correlation IDs.
 * WHY: At scale, grep-ing logs is impossible. Structured JSON logs
 * enable log aggregation, alerting, and tracing across distributed services.
 */

import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Log levels
// ---------------------------------------------------------------------------

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

// ---------------------------------------------------------------------------
// Context (per-request correlation)
// ---------------------------------------------------------------------------

interface LogContext {
  correlationId: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

// Simple async context using AsyncLocalStorage would be ideal,
// but for Next.js serverless we use explicit context passing.
let _globalCorrelationId: string | undefined;

export function setCorrelationId(id: string): void {
  _globalCorrelationId = id;
}

export function getCorrelationId(): string {
  return _globalCorrelationId ?? randomUUID();
}

export function clearCorrelationId(): void {
  _globalCorrelationId = undefined;
}

// ---------------------------------------------------------------------------
// Sanitization (GDPR-safe)
// ---------------------------------------------------------------------------

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "api_key",
  "apikey",
  "credit_card",
  "ssn",
  "password_hash",
  "stripe_token",
  "payment_intent",
  "authorization",
  "cookie",
  "session",
  "refresh_token",
  "access_token",
  "vapid_key",
]);

function sanitizeValue(key: string, value: unknown): unknown {
  const lowerKey = key.toLowerCase();
  for (const sensitive of SENSITIVE_KEYS) {
    if (lowerKey.includes(sensitive)) {
      return "[REDACTED]";
    }
  }

  if (typeof value === "object" && value !== null) {
    return sanitizeObject(value as Record<string, unknown>);
  }

  // Redact email addresses in non-email fields
  if (typeof value === "string" && lowerKey !== "email" && lowerKey !== "user_email") {
    if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return "[REDACTED_EMAIL]";
    }
  }

  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(key, value);
  }
  return sanitized;
}

// ---------------------------------------------------------------------------
// Structured log entry
// ---------------------------------------------------------------------------

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  correlationId: string;
  context?: LogContext;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  durationMs?: number;
}

function buildLogEntry(
  level: LogLevel,
  message: string,
  options?: {
    context?: Partial<LogContext>;
    metadata?: Record<string, unknown>;
    error?: Error;
    durationMs?: number;
  }
): LogEntry {
  const correlationId = options?.context?.correlationId ?? getCorrelationId();

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "andamus-api",
    correlationId,
    context: options?.context as LogContext,
    durationMs: options?.durationMs,
  };

  if (options?.metadata) {
    entry.metadata = sanitizeObject(options.metadata);
  }

  if (options?.error) {
    entry.error = {
      name: options.error.name,
      message: options.error.message,
      code: (options.error as Record<string, unknown>).code as string | undefined,
    };

    // Include stack only in non-production
    if (process.env.NODE_ENV !== "production") {
      entry.error.stack = options.error.stack;
    }
  }

  return entry;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function output(entry: LogEntry): void {
  // In production, output as single-line JSON for log aggregators
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  } else {
    // In development, pretty-print
    const color = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m",  // green
      warn: "\x1b[33m",  // yellow
      error: "\x1b[31m", // red
      fatal: "\x1b[35m", // magenta
    }[entry.level];

    const reset = "\x1b[0m";
    const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`;
    const time = entry.timestamp;
    const corr = entry.correlationId.slice(0, 8);

    // eslint-disable-next-line no-console
    console.log(`${prefix} ${time} [${corr}] ${entry.message}`);

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      // eslint-disable-next-line no-console
      console.log("  metadata:", JSON.stringify(entry.metadata, null, 2));
    }

    if (entry.error) {
      // eslint-disable-next-line no-console
      console.log("  error:", entry.error.name, "-", entry.error.message);
      if (entry.error.stack) {
        // eslint-disable-next-line no-console
        console.log("  stack:", entry.error.stack.split("\n").slice(0, 3).join("\n"));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function logDebug(
  message: string,
  options?: { context?: Partial<LogContext>; metadata?: Record<string, unknown> }
): void {
  if (!shouldLog("debug")) return;
  output(buildLogEntry("debug", message, options));
}

export function logInfo(
  message: string,
  options?: { context?: Partial<LogContext>; metadata?: Record<string, unknown> }
): void {
  if (!shouldLog("info")) return;
  output(buildLogEntry("info", message, options));
}

export function logWarn(
  message: string,
  options?: { context?: Partial<LogContext>; metadata?: Record<string, unknown>; error?: Error }
): void {
  if (!shouldLog("warn")) return;
  output(buildLogEntry("warn", message, options));
}

export function logError(
  message: string,
  options?: { context?: Partial<LogContext>; metadata?: Record<string, unknown>; error?: Error }
): void {
  if (!shouldLog("error")) return;
  output(buildLogEntry("error", message, options));
}

export function logFatal(
  message: string,
  options?: { context?: Partial<LogContext>; metadata?: Record<string, unknown>; error?: Error }
): void {
  if (!shouldLog("fatal")) return;
  output(buildLogEntry("fatal", message, options));
}

// ---------------------------------------------------------------------------
// Request logging wrapper
// ---------------------------------------------------------------------------

export interface RequestLog {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export function logRequest(request: RequestLog): void {
  const level: LogLevel = request.statusCode >= 500 ? "error" :
    request.statusCode >= 400 ? "warn" : "info";

  if (!shouldLog(level)) return;

  output(buildLogEntry(level, `${request.method} ${request.path} ${request.statusCode}`, {
    context: {
      correlationId: getCorrelationId(),
      requestId: randomUUID(),
      userId: request.userId,
      path: request.path,
      method: request.method,
    },
    metadata: {
      statusCode: request.statusCode,
      durationMs: request.durationMs,
      ip: request.ip,
      userAgent: request.userAgent,
    },
    durationMs: request.durationMs,
  }));
}

// ---------------------------------------------------------------------------
// Timing helper
// ---------------------------------------------------------------------------

export async function withLogging<T>(
  label: string,
  fn: () => Promise<T>,
  options?: { context?: Partial<LogContext>; metadata?: Record<string, unknown> }
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logInfo(`${label} succeeded`, {
      ...options,
      metadata: { ...options?.metadata, durationMs: duration },
    });
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    logError(`${label} failed`, {
      ...options,
      metadata: { ...options?.metadata, durationMs: duration },
      error: err instanceof Error ? err : new Error(String(err)),
    });
    throw err;
  }
}
