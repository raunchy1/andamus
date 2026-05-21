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
