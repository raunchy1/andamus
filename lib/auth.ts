"use client";

import { createClient } from "@/lib/supabase/client";

export type { User, Session } from "@supabase/supabase-js";

function getCallbackPath(redirectTo?: string): string {
  if (typeof window === "undefined") {
    return `${process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app"}/auth/callback`;
  }

  const origin = window.location.origin;
  const locale = window.location.pathname.split("/")[1];
  const safeLocale = ["it", "en", "de"].includes(locale) ? locale : "it";

  let targetPath = redirectTo || `${window.location.pathname}${window.location.search}`;

  if (!targetPath.startsWith("/")) {
    targetPath = "/" + targetPath;
  }

  // Prepend locale prefix if not already present in the target path
  if (!/^\/(it|en|de)(\/|$)/.test(targetPath)) {
    targetPath = `/${safeLocale}${targetPath}`;
  }

  // Prevent infinite login loops on callback pages
  const safeTarget = targetPath.includes("/auth/callback") || targetPath.includes("/auth/auth-code-error")
    ? `/${safeLocale}/profilo`
    : targetPath;

  return `${origin}/auth/callback?next=${encodeURIComponent(safeTarget)}`;
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getCallbackPath(redirectTo),
    },
  });

  if (error) throw error;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  redirectTo?: string
) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, name: fullName },
      emailRedirectTo: getCallbackPath(redirectTo),
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  if (typeof window !== "undefined") {
    const locale = window.location.pathname.split("/")[1];
    const target = ["it", "en", "de"].includes(locale) ? `/${locale}` : "/";
    window.location.href = target;
  }
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

/**
 * @deprecated Use `getUser()` for security. This validates the JWT first,
 * then returns the locally-cached session — safe for session metadata only.
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function resetPassword(email: string, redirectTo?: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getCallbackPath(redirectTo).replace("/auth/callback", "/auth/reset-password"),
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
