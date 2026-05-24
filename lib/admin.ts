"use server";

import {
  isAdmin as checkIsAdmin,
  requireAdmin as _requireAdmin,
} from "@/lib/session";

export async function isAdmin(userId: string, email?: string | null): Promise<boolean> {
  return checkIsAdmin(userId, email);
}

export async function requireAdmin() {
  return _requireAdmin();
}

/**
 * @deprecated Use `requireAdmin()` directly.
 */
export async function checkAdminAccess(): Promise<boolean> {
  const { getCurrentUser } = await import("@/lib/session");
  const user = await getCurrentUser();
  if (!user?.id) return false;
  return checkIsAdmin(user.id, user.email);
}
