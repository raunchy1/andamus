import "server-only";

/**
 * Circuit Breaker
 * ===============
 * Prevents cascading failures by stopping requests to failing services.
 * WHY: When Stripe, Supabase, or Redis are down, repeated retries
 * overwhelm the failing service and exhaust our own resources.
 * Circuit breakers fail fast and enable graceful degradation.
 */

import { getRedis } from "@/lib/redis";
import { logWarn, logError } from "@/lib/server/observability/logging";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening
  recoveryTimeoutMs: number;     // Time before trying again
  halfOpenMaxCalls: number;      // Test calls in half-open state
  successThreshold: number;      // Successes needed to close
}

export interface CircuitBreakerStatus {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  totalCalls: number;
  totalFailures: number;
}

// ---------------------------------------------------------------------------
// Default configs per service
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30000,
  halfOpenMaxCalls: 3,
  successThreshold: 2,
};

const SERVICE_CONFIGS: Record<string, CircuitBreakerConfig> = {
  stripe: {
    failureThreshold: 3,
    recoveryTimeoutMs: 15000,
    halfOpenMaxCalls: 2,
    successThreshold: 2,
  },
  supabase: {
    failureThreshold: 5,
    recoveryTimeoutMs: 10000,
    halfOpenMaxCalls: 3,
    successThreshold: 2,
  },
  redis: {
    failureThreshold: 3,
    recoveryTimeoutMs: 5000,
    halfOpenMaxCalls: 1,
    successThreshold: 1,
  },
  push: {
    failureThreshold: 5,
    recoveryTimeoutMs: 60000,
    halfOpenMaxCalls: 2,
    successThreshold: 1,
  },
  ai: {
    failureThreshold: 3,
    recoveryTimeoutMs: 30000,
    halfOpenMaxCalls: 1,
    successThreshold: 1,
  },
};

// In-memory state (resets on cold start, but that's acceptable for serverless)
const _circuitStates = new Map<string, CircuitBreakerStatus>();

function getStatus(name: string): CircuitBreakerStatus {
  let status = _circuitStates.get(name);
  if (!status) {
    status = {
      name,
      state: "closed",
      failures: 0,
      successes: 0,
      lastFailureAt: null,
      lastSuccessAt: null,
      totalCalls: 0,
      totalFailures: 0,
    };
    _circuitStates.set(name, status);
  }
  return status;
}

function getConfig(name: string): CircuitBreakerConfig {
  return SERVICE_CONFIGS[name] ?? DEFAULT_CONFIG;
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

function shouldAllowCall(status: CircuitBreakerStatus, config: CircuitBreakerConfig): boolean {
  if (status.state === "closed") return true;

  if (status.state === "open") {
    const timeSinceLastFailure = status.lastFailureAt
      ? Date.now() - status.lastFailureAt
      : Infinity;

    if (timeSinceLastFailure > config.recoveryTimeoutMs) {
      status.state = "half_open";
      status.successes = 0;
      logWarn(`Circuit breaker ${status.name} entering half-open state`);
      return true;
    }

    return false;
  }

  // half_open
  const halfOpenCalls = status.totalCalls - (status.lastFailureAt ? 0 : status.totalCalls);
  // Simpler: just track calls in half-open via a counter
  // For simplicity, we allow up to halfOpenMaxCalls
  return status.successes < config.halfOpenMaxCalls;
}

function recordSuccess(status: CircuitBreakerStatus, config: CircuitBreakerConfig): void {
  status.totalCalls++;
  status.lastSuccessAt = Date.now();

  if (status.state === "half_open") {
    status.successes++;
    if (status.successes >= config.successThreshold) {
      status.state = "closed";
      status.failures = 0;
      status.successes = 0;
      logWarn(`Circuit breaker ${status.name} closed after recovery`);
    }
  } else {
    status.failures = Math.max(0, status.failures - 1);
  }
}

function recordFailure(status: CircuitBreakerStatus, config: CircuitBreakerConfig): void {
  status.totalCalls++;
  status.totalFailures++;
  status.lastFailureAt = Date.now();

  if (status.state === "half_open") {
    status.state = "open";
    status.failures = config.failureThreshold;
    logError(`Circuit breaker ${status.name} re-opened after half-open failure`);
    return;
  }

  status.failures++;
  if (status.failures >= config.failureThreshold) {
    status.state = "open";
    logError(`Circuit breaker ${status.name} opened after ${status.failures} failures`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  circuitOpen: boolean;
  fromFallback?: boolean;
}

/**
 * Execute a function through a circuit breaker.
 * Returns fallback value if circuit is open or call fails.
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options?: {
    fallback?: () => Promise<T> | T;
    fallbackValue?: T;
  }
): Promise<CircuitBreakerResult<T>> {
  const status = getStatus(serviceName);
  const config = getConfig(serviceName);

  if (!shouldAllowCall(status, config)) {
    // Circuit is open — try fallback
    if (options?.fallback) {
      try {
        const fallbackResult = await options.fallback();
        return { success: true, data: fallbackResult, circuitOpen: true, fromFallback: true };
      } catch {
        return { success: false, circuitOpen: true, error: `Circuit open for ${serviceName}` };
      }
    }

    if (options?.fallbackValue !== undefined) {
      return { success: true, data: options.fallbackValue, circuitOpen: true, fromFallback: true };
    }

    return { success: false, circuitOpen: true, error: `Circuit open for ${serviceName}` };
  }

  try {
    const result = await fn();
    recordSuccess(status, config);
    return { success: true, data: result, circuitOpen: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordFailure(status, config);

    // Try fallback on failure too
    if (options?.fallback) {
      try {
        const fallbackResult = await options.fallback();
        return { success: true, data: fallbackResult, circuitOpen: false, fromFallback: true };
      } catch {
        return { success: false, circuitOpen: false, error: message };
      }
    }

    if (options?.fallbackValue !== undefined) {
      return { success: true, data: options.fallbackValue, circuitOpen: false, fromFallback: true };
    }

    return { success: false, circuitOpen: false, error: message };
  }
}

/**
 * Get the current status of all circuit breakers.
 */
export function getAllCircuitStatuses(): CircuitBreakerStatus[] {
  return Array.from(_circuitStates.values());
}

/**
 * Get status for a specific circuit breaker.
 */
export function getCircuitStatus(name: string): CircuitBreakerStatus {
  return getStatus(name);
}

/**
 * Manually reset a circuit breaker (useful after incident resolution).
 */
export function resetCircuit(name: string): void {
  const status = getStatus(name);
  status.state = "closed";
  status.failures = 0;
  status.successes = 0;
  status.lastFailureAt = null;
}

/**
 * Check if a circuit is currently open.
 */
export function isCircuitOpen(name: string): boolean {
  const status = getStatus(name);
  const config = getConfig(name);

  if (status.state === "open") {
    const timeSinceLastFailure = status.lastFailureAt
      ? Date.now() - status.lastFailureAt
      : Infinity;
    return timeSinceLastFailure <= config.recoveryTimeoutMs;
  }

  return false;
}
