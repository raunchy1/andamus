/**
 * Server-side observability helpers for API routes.
 * Combines request logging, performance timing, and error reporting.
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { logger, getRequestId } from "@/lib/logger";

interface RequestLogMeta {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

/**
 * Log an API request with structured metadata.
 */
export function logRequest(meta: RequestLogMeta): void {
  const { method, path, status, durationMs, userAgent, ip, userId } = meta;

  const isError = status >= 500;
  const logFn = isError ? logger.error.bind(logger) : logger.info.bind(logger);

  logFn("API request", {
    method,
    path,
    status,
    durationMs,
    userAgent: userAgent ?? null,
    ip: ip ?? null,
    userId: userId ?? null,
  });
}

/**
 * Create a performance timer that returns elapsed milliseconds.
 */
export function createTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

interface ErrorReportContext {
  requestId?: string;
  route?: string;
  method?: string;
  userId?: string;
  locale?: string;
  userAgent?: string;
  ip?: string;
  extra?: Record<string, unknown>;
}

/**
 * Report an error to both Sentry and the structured logger.
 */
export function reportError(error: unknown, context: ErrorReportContext = {}): void {
  const { requestId, route, method, userId, locale, extra } = context;

  const message = error instanceof Error ? error.message : String(error);
  const errorContext = {
    error: message,
    stack: error instanceof Error ? error.stack : undefined,
    route,
    method,
    userId,
    locale,
    requestId,
    ...extra,
  };

  // Log locally
  logger.error("Error reported", errorContext);

  // Send to Sentry with scope context
  Sentry.withScope((scope) => {
    if (requestId) scope.setTag("request_id", requestId);
    if (route) scope.setTag("route", route);
    if (method) scope.setTag("method", method);
    if (locale) scope.setTag("locale", locale);
    if (userId) scope.setUser({ id: userId });
    if (extra) scope.setExtras(extra);
    Sentry.captureException(error);
  });
}

/**
 * Wrapper for API route handlers that adds:
 * - Request ID correlation
 * - Structured request logging
 * - Performance timing
 * - Automatic error reporting
 */
export function withObservability(
  handler: (req: NextRequest, log: typeof logger) => Promise<NextResponse>,
  options?: { route?: string }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = getRequestId(req);
    const log = logger.withRequestId(requestId);
    const timer = createTimer();

    const route = options?.route ?? req.nextUrl.pathname;
    const method = req.method;
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") ?? undefined;

    // Attach request ID to response
    let response: NextResponse;

    try {
      response = await handler(req, log);
    } catch (err) {
      const durationMs = timer();
      logRequest({
        method,
        path: route,
        status: 500,
        durationMs,
        userAgent,
        ip,
      });
      reportError(err, {
        requestId,
        route,
        method,
        userAgent,
        ip,
      });

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR", requestId },
        { status: 500 }
      );
    }

    const durationMs = timer();
    logRequest({
      method,
      path: route,
      status: response.status,
      durationMs,
      userAgent,
      ip,
    });

    // Attach request ID header for tracing
    response.headers.set("x-request-id", requestId);
    return response;
  };
}
