/**
 * Server-side admin authorization guards.
 * Checks admin role from database `user_roles` table first,
 * falls back to env-based admin emails for migration period.
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { AuthError, requireAuth, type AuthContext } from "./auth";
import { env } from "@/lib/server/validators/env";

// Env-based fallback for migration period
function getEnvAdminEmails(): string[] {
  try {
    const e = env();
    return (e.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Check if a user has admin role in the database.
 * Uses service_role client to bypass RLS on user_roles table.
 */
export async function isAdminInDatabase(userId: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.error("[admin] DB role check failed:", error.message);
      return false;
    }

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Check if an email is in the env admin list (fallback).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = getEnvAdminEmails();
  return admins.includes(email.toLowerCase().trim());
}

/**
 * Unified admin check: DB role first, then env fallback.
 */
export async function checkIsAdmin(userId: string, email?: string | null): Promise<boolean> {
  // Primary: database role
  const dbAdmin = await isAdminInDatabase(userId);
  if (dbAdmin) return true;

  // Fallback: env-based emails (for migration / bootstrap)
  if (email && isAdminEmail(email)) return true;

  return false;
}

/**
 * Require admin access. Throws AuthError if not admin.
 */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth();
  const admin = await checkIsAdmin(ctx.userId, ctx.user.email);

  if (!admin) {
    throw new AuthError("Admin access required", 403, "FORBIDDEN");
  }

  return ctx;
}

/**
 * Middleware-style guard for admin API routes.
 */
export async function apiAdminGuard(): Promise<AuthContext> {
  return requireAdmin();
}

// Re-export with legacy name for backward compatibility
export { checkIsAdmin as isAdmin };
