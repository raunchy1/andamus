import * as Sentry from "@sentry/nextjs";

export function setSentryUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
} | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
    username: user.name || undefined,
  });
}

export function setSentryTags(tags: Record<string, string>) {
  Sentry.setTags(tags);
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

// ─── Breadcrumbs for critical user actions ──────────────────────────────────

export type CriticalAction =
  | "booking.created"
  | "booking.confirmed"
  | "booking.cancelled"
  | "booking.rejected"
  | "payment.initiated"
  | "payment.completed"
  | "payment.failed"
  | "auth.signup"
  | "auth.login"
  | "auth.logout"
  | "auth.oauth_callback"
  | "profile.updated"
  | "stripe.connect.onboarded";

/**
 * Add a Sentry breadcrumb for a critical user action.
 * Use this to trace user journeys through booking, payment, and auth flows.
 */
export function addActionBreadcrumb(
  action: CriticalAction,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.addBreadcrumb({
    category: "action",
    message: action,
    data,
    level,
  });
}

/**
 * Set common context tags for the current scope.
 * Call this after auth resolution in API routes or page loads.
 */
export function setUserContext(
  locale: string,
  userType: "driver" | "passenger" | "admin" | "anonymous" | "unknown",
  extras?: Record<string, string>
) {
  Sentry.setTags({
    locale,
    user_type: userType,
    ...extras,
  });
}

/**
 * Report an API error with full context.
 */
export function reportApiError(
  error: unknown,
  meta: {
    route: string;
    method: string;
    locale?: string;
    userId?: string;
    userType?: string;
    requestId?: string;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag("route", meta.route);
    scope.setTag("method", meta.method);
    if (meta.locale) scope.setTag("locale", meta.locale);
    if (meta.userType) scope.setTag("user_type", meta.userType);
    if (meta.requestId) scope.setTag("request_id", meta.requestId);
    if (meta.userId) scope.setUser({ id: meta.userId });
    Sentry.captureException(error);
  });
}
