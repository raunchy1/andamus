"use server";

/**
 * Retry Strategies
 * ================
 * Configurable retry with exponential backoff, jitter, and circuit breaker integration.
 * WHY: Transient failures are common in distributed systems. Smart retries
 * recover automatically without overwhelming downstream services.
 */

import { withCircuitBreaker } from "./circuit-breaker";
import { logWarn } from "@/lib/server/observability/logging";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // 0-1, adds randomness
  retryableErrors?: string[]; // Error messages/substrings that should trigger retry
  nonRetryableErrors?: string[]; // Errors that should NOT be retried
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

// ---------------------------------------------------------------------------
// Jitter
// ---------------------------------------------------------------------------

function addJitter(delay: number, jitterFactor: number): number {
  const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(delay + jitter));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

function isRetryableError(error: Error, config: RetryConfig): boolean {
  const message = error.message.toLowerCase();

  // Non-retryable errors (business logic, auth, validation)
  const nonRetryable = [
    "unauthorized",
    "forbidden",
    "not found",
    "invalid",
    "already exists",
    "duplicate",
    "rate limit exceeded",
    "quota exceeded",
    "bad request",
    "validation failed",
    "not allowed",
    "rls policy",
  ];

  for (const pattern of nonRetryable) {
    if (message.includes(pattern)) return false;
  }

  if (config.nonRetryableErrors) {
    for (const pattern of config.nonRetryableErrors) {
      if (message.includes(pattern.toLowerCase())) return false;
    }
  }

  // Explicitly retryable errors
  if (config.retryableErrors) {
    for (const pattern of config.retryableErrors) {
      if (message.includes(pattern.toLowerCase())) return true;
    }
  }

  // Default: retry on network/timeout errors
  const retryable = [
    "timeout",
    "network",
    "connection",
    "econnrefused",
    "econnreset",
    "etimedout",
    "socket",
    "temporarily unavailable",
    "too many connections",
    "busy",
    "deadlock",
    "lock",
  ];

  for (const pattern of retryable) {
    if (message.includes(pattern)) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Core retry
// ---------------------------------------------------------------------------

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Execute a function with retry logic.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;
  let totalDelayMs = 0;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      const result = await fn();
      return { success: true, data: result, attempts: attempt + 1, totalDelayMs };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === cfg.maxRetries) break;
      if (!isRetryableError(lastError, cfg)) break;

      const delay = Math.min(
        cfg.baseDelayMs * Math.pow(cfg.backoffMultiplier, attempt),
        cfg.maxDelayMs
      );
      const jitteredDelay = addJitter(delay, cfg.jitterFactor);
      totalDelayMs += jitteredDelay;

      if (cfg.onRetry) {
        cfg.onRetry(attempt + 1, lastError, jitteredDelay);
      }

      logWarn(`Retry ${attempt + 1}/${cfg.maxRetries} after ${jitteredDelay}ms: ${lastError.message}`);

      await sleep(jitteredDelay);
    }
  }

  return {
    success: false,
    error: lastError?.message ?? "Unknown error",
    attempts: cfg.maxRetries + 1,
    totalDelayMs,
  };
}

// ---------------------------------------------------------------------------
// Retry with circuit breaker
// ---------------------------------------------------------------------------

/**
 * Execute with both retry and circuit breaker protection.
 * This is the RECOMMENDED pattern for external service calls.
 */
export async function withResilience<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options?: {
    retry?: Partial<RetryConfig>;
    fallback?: () => Promise<T> | T;
    fallbackValue?: T;
  }
): Promise<RetryResult<T> & { circuitOpen: boolean; fromFallback?: boolean }> {
  const cbResult = await withCircuitBreaker(
    serviceName,
    async () => {
      const retryResult = await withRetry(fn, options?.retry);
      if (!retryResult.success) {
        throw new Error(retryResult.error ?? "Retry exhausted");
      }
      return retryResult.data as T;
    },
    {
      fallback: options?.fallback,
      fallbackValue: options?.fallbackValue,
    }
  );

  return {
    success: cbResult.success,
    data: cbResult.data,
    error: cbResult.error,
    attempts: 1,
    totalDelayMs: 0,
    circuitOpen: cbResult.circuitOpen,
    fromFallback: cbResult.fromFallback,
  };
}

// ---------------------------------------------------------------------------
// Service-specific retry configs
// ---------------------------------------------------------------------------

export const RetryPresets = {
  supabase: {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  } satisfies Partial<RetryConfig>,

  stripe: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  } satisfies Partial<RetryConfig>,

  redis: {
    maxRetries: 2,
    baseDelayMs: 100,
    maxDelayMs: 1000,
    backoffMultiplier: 2,
    jitterFactor: 0.3,
  } satisfies Partial<RetryConfig>,

  push: {
    maxRetries: 2,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  } satisfies Partial<RetryConfig>,

  externalApi: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  } satisfies Partial<RetryConfig>,
} as const;
