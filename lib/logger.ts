/**
 * Structured logger for Andamus.
 * JSON in production, pretty in development.
 * Supports request ID correlation for tracing.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  context?: LogContext;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel && envLevel in LOG_LEVELS) return envLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLevel()];
}

function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    };
  }
  return { unknown: String(err) };
}

function writeLog(entry: LogEntry) {
  if (process.env.NODE_ENV === "production") {
    // JSON for production (CloudWatch, Datadog, etc.)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  } else {
    // Pretty for development
    const color = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m",  // green
      warn: "\x1b[33m",  // yellow
      error: "\x1b[31m", // red
    }[entry.level];
    const reset = "\x1b[0m";
    const ctx = entry.context ? ` | ${JSON.stringify(entry.context)}` : "";
    const req = entry.requestId ? ` [${entry.requestId}]` : "";
    const user = entry.userId ? ` (user:${entry.userId})` : "";
    // eslint-disable-next-line no-console
    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp}${req}${user} ${entry.message}${ctx}`
    );
  }
}

class Logger {
  private requestId?: string;
  private userId?: string;

  constructor(requestId?: string, userId?: string) {
    this.requestId = requestId;
    this.userId = userId;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!shouldLog(level)) return;

    writeLog({
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      userId: this.userId,
      context,
    });
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }

  /**
   * Create a child logger with additional context.
   */
  child(_context: LogContext): Logger {
    return new Logger(this.requestId, this.userId);
  }

  /**
   * Create a logger bound to a specific request ID.
   */
  withRequestId(requestId: string): Logger {
    return new Logger(requestId, this.userId);
  }

  /**
   * Create a logger for a specific request and optional user.
   */
  forRequest(requestId: string, userId?: string): Logger {
    return new Logger(requestId, userId);
  }
}

export const logger = new Logger();
export { Logger };

/**
 * Extract or generate a request ID from a Request.
 */
export function getRequestId(req: Request): string {
  const headerId = req.headers.get("x-request-id");
  if (headerId) return headerId;
  return generateRequestId();
}

function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}`;
}
