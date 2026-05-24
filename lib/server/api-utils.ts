/**
 * Reusable API utilities for Route Handlers.
 * Combines Zod validation, auth guards, rate limiting, and typed error responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { z, type ZodSchema, type ZodError } from "zod";
import { apiAuthGuard, requireAdmin, AuthError } from "@/lib/server/guards";
import { checkRateLimit, rateLimitPresets, type RateLimitResult } from "@/lib/server/rate-limit/redis";
import type { AuthContext } from "@/lib/server/guards/auth";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/server/observability";

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string[]> | string[];
}

export interface ApiSuccessResponse<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
}

export function formatZodError(error: ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "root";
    if (!result[path]) result[path] = [];
    result[path].push(issue.message);
  }
  return result;
}

export function apiError(
  message: string,
  code: string,
  status: number = 400,
  details?: Record<string, string[]> | string[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message, code, details }, { status });
}

export function unauthorized(message = "Authentication required", code = "UNAUTHORIZED"): NextResponse<ApiErrorResponse> {
  return apiError(message, code, 401);
}

export function forbidden(message = "Access denied", code = "FORBIDDEN"): NextResponse<ApiErrorResponse> {
  return apiError(message, code, 403);
}

export function validationError(
  message = "Validation failed",
  details?: Record<string, string[]> | string[]
): NextResponse<ApiErrorResponse> {
  return apiError(message, "VALIDATION_ERROR", 400, details);
}

export function apiSuccess<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, unknown>
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data, meta }, { status });
}

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AuthError("Invalid JSON body", 400, "INVALID_JSON");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const details = formatZodError(parsed.error);
    const err = new AuthError("Validation failed", 400, "VALIDATION_ERROR");
    (err as AuthError & { details: Record<string, string[]> }).details = details;
    throw err;
  }

  return parsed.data;
}

export function parseQuery<T>(searchParams: URLSearchParams, schema: ZodSchema<T>): T {
  const raw: Record<string, unknown> = {};
  searchParams.forEach((value, key) => {
    if (raw[key] !== undefined) {
      if (Array.isArray(raw[key])) {
        (raw[key] as string[]).push(value);
      } else {
        raw[key] = [raw[key] as string, value];
      }
    } else {
      raw[key] = value;
    }
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new AuthError("Invalid query parameters", 400, "VALIDATION_ERROR");
  }
  return parsed.data;
}

interface RouteHandlerOptions {
  rateLimit?: { limit: number; window: "1s" | "10s" | "1m" | "5m" | "10m" | "1h" | "6h" | "12h" | "24h" };
  rateLimitKey?: (req: NextRequest) => string;
}

function defaultRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `rl:ip:${ip}`;
}

async function applyRateLimit(
  req: NextRequest,
  options?: RouteHandlerOptions
): Promise<RateLimitResult | null> {
  if (!options?.rateLimit) return null;

  const key = options.rateLimitKey ? options.rateLimitKey(req) : defaultRateLimitKey(req);
  const result = await checkRateLimit({
    identifier: key,
    limit: options.rateLimit.limit,
    window: options.rateLimit.window,
  });

  return result;
}

export function withRateLimit<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  options?: RouteHandlerOptions
) {
  return async (req: NextRequest): Promise<NextResponse<T | ApiErrorResponse>> => {
    const rl = await applyRateLimit(req, options);
    if (rl && !rl.success) {
      return apiError("Rate limit exceeded", "RATE_LIMITED", 429, {
        retryAfter: [`${Math.ceil((rl.reset - Date.now()) / 1000)}`],
      });
    }

    try {
      const response = await handler(req);
      if (rl) {
        response.headers.set("X-RateLimit-Limit", String(rl.limit));
        response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
        response.headers.set("X-RateLimit-Reset", String(rl.reset));
      }
      return response;
    } catch (err) {
      if (err instanceof AuthError) {
        return apiError(err.message, err.code, err.statusCode) as NextResponse<T | ApiErrorResponse>;
      }
      logger.error("[api] Unhandled error in withRateLimit", { error: err instanceof Error ? err.message : String(err) });
      reportError(err, { route: "withRateLimit", method: req.method });
      return apiError("Internal server error", "INTERNAL_ERROR", 500) as NextResponse<T | ApiErrorResponse>;
    }
  };
}

export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse<unknown>>,
  options?: RouteHandlerOptions
) {
  return async (req: NextRequest): Promise<NextResponse<unknown>> => {
    const rl = await applyRateLimit(req, options);
    if (rl && !rl.success) {
      return apiError("Rate limit exceeded", "RATE_LIMITED", 429);
    }

    let auth: AuthContext;
    try {
      const guardResult = await apiAuthGuard(req);
      if (guardResult instanceof NextResponse) {
        return guardResult as NextResponse<unknown>;
      }
      auth = guardResult;
    } catch (err) {
      if (err instanceof AuthError) {
        return apiError(err.message, err.code, err.statusCode) as NextResponse<unknown>;
      }
      return apiError("Authentication failed", "AUTH_ERROR", 401) as NextResponse<unknown>;
    }

    try {
      const response = await handler(req, auth);
      if (rl) {
        response.headers.set("X-RateLimit-Limit", String(rl.limit));
        response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
        response.headers.set("X-RateLimit-Reset", String(rl.reset));
      }
      return response;
    } catch (err) {
      if (err instanceof AuthError) {
        return apiError(err.message, err.code, err.statusCode) as NextResponse<unknown>;
      }
      logger.error("[api] Unhandled error in withAuth", { error: err instanceof Error ? err.message : String(err) });
      reportError(err, { route: "withAuth", method: req.method });
      return apiError("Internal server error", "INTERNAL_ERROR", 500) as NextResponse<unknown>;
    }
  };
}

export function withAdmin(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse<unknown>>,
  options?: RouteHandlerOptions
) {
  return async (req: NextRequest): Promise<NextResponse<unknown>> => {
    const rl = await applyRateLimit(req, options);
    if (rl && !rl.success) {
      return apiError("Rate limit exceeded", "RATE_LIMITED", 429);
    }

    let auth: AuthContext;
    try {
      auth = await requireAdmin();
    } catch (err) {
      if (err instanceof AuthError) {
        return apiError(err.message, err.code, err.statusCode) as NextResponse<unknown>;
      }
      return apiError("Admin authentication failed", "ADMIN_AUTH_ERROR", 403) as NextResponse<unknown>;
    }

    try {
      const response = await handler(req, auth);
      if (rl) {
        response.headers.set("X-RateLimit-Limit", String(rl.limit));
        response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
        response.headers.set("X-RateLimit-Reset", String(rl.reset));
      }
      return response;
    } catch (err) {
      if (err instanceof AuthError) {
        return apiError(err.message, err.code, err.statusCode) as NextResponse<unknown>;
      }
      logger.error("[api] Unhandled error in withAdmin", { error: err instanceof Error ? err.message : String(err) });
      reportError(err, { route: "withAdmin", method: req.method });
      return apiError("Internal server error", "INTERNAL_ERROR", 500) as NextResponse<unknown>;
    }
  };
}

export { rateLimitPresets };
