/**
 * Admin configuration — SERVER ONLY. Never import from client components.
 *
 * Admin authorization is now database-driven via `user_roles` table.
 * Env-based emails (NEXT_PUBLIC_ADMIN_EMAILS) serve as a fallback
 * for bootstrapping and legacy support only.
 */

import { env } from "@/lib/server/validators/env";

/**
 * Get env-based admin emails (fallback only).
 * @deprecated Use database `user_roles` table for production admin checks.
 */
export function getEnvAdminEmails(): string[] {
  try {
    const e = env();
    return (e.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Check if an email is in the env admin list.
 * Safe for client-side use (checks env only, no DB round-trip).
 * @deprecated Use server-side `requireAdmin()` for API routes.
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return getEnvAdminEmails().includes(email.toLowerCase().trim());
}

/**
 * Check if an email is in the env admin list.
 * @deprecated Use `checkIsAdmin()` from `@/lib/server/guards/admin` for unified checks.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  return isAdmin(email);
}
