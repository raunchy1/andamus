/**
 * Server-side authentication guards.
 * Use in API routes and Server Actions to enforce auth consistently.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
 * Require an authenticated user. Throws AuthError if missing.
 * Use in API routes where you need the full user object.
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
 * Optionally get the current user. Returns null if not authenticated.
 */
export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Middleware-style guard for API routes.
 * Returns a NextResponse if auth fails, otherwise returns the AuthContext.
 */
export async function apiAuthGuard(req: NextRequest): Promise<AuthContext | NextResponse> {
  try {
    return await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Authentication failed", code: "AUTH_ERROR" },
      { status: 401 }
    );
  }
}

/**
 * Validate that a request body belongs to the authenticated user.
 * Prevents IDOR (Insecure Direct Object Reference) attacks.
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
