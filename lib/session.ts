"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { User } from "@supabase/supabase-js";

export interface AuthContext {
  user: User;
  userId: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = "UNAUTHORIZED"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Get the currently authenticated user. Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Require an authenticated user. Throws AuthError if missing.
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new AuthError("Authentication required", 401, "UNAUTHORIZED");
  }

  return { user: data.user, userId: data.user.id };
}

/**
 * Check if a user has admin role in the database.
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
      console.error("[session] DB role check failed:", error.message);
      return false;
    }
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Check if an email is in the admin env list.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  const admins = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase().trim());
}

/**
 * Unified admin check: DB role first, then env fallback.
 */
export async function isAdmin(userId: string, email?: string | null): Promise<boolean> {
  const dbAdmin = await isAdminInDatabase(userId);
  if (dbAdmin) return true;
  if (email && isAdminEmail(email)) return true;
  return false;
}

/**
 * Require admin access. Throws AuthError if not authenticated or not admin.
 */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth();
  const admin = await isAdmin(ctx.userId, ctx.user.email);

  if (!admin) {
    throw new AuthError("Admin access required", 403, "FORBIDDEN");
  }

  return ctx;
}

/**
 * Validate resource ownership to prevent IDOR attacks.
 */
export function ensureOwnership(authUserId: string, resourceUserId: string, resourceName = "resource"): void {
  if (authUserId !== resourceUserId) {
    throw new AuthError(
      `You do not have permission to access this ${resourceName}`,
      403,
      "FORBIDDEN"
    );
  }
}
