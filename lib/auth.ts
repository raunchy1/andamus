"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Obtain an OAuth state token from the server for CSRF protection.
 */
async function fetchOAuthState(): Promise<string> {
  const response = await fetch("/api/auth/oauth-state", {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Failed to initialize OAuth state");
  }

  const { state } = await response.json();
  if (!state || typeof state !== "string") {
    throw new Error("Invalid OAuth state response");
  }

  return state;
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();

  const finalRedirectTo =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname.split("/").slice(0, 2).join("/")}/auth/callback`
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") +
        "/it/auth/callback");

  // Fetch CSRF state token from server (stored in httpOnly cookie)
  const state = await fetchOAuthState();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: finalRedirectTo,
      state,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  redirectTo?: string
) {
  const supabase = createClient();

  const finalRedirectTo =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname.split("/").slice(0, 2).join("/")}/auth/callback`
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") +
        "/it/auth/callback");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        name: fullName,
      },
      emailRedirectTo: finalRedirectTo,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  // Hard reload to clear all state and re-run middleware; preserve current locale.
  if (typeof window !== "undefined") {
    const locale = window.location.pathname.split("/")[1];
    const target = ["it", "en", "de"].includes(locale) ? `/${locale}` : "/";
    window.location.href = target;
  }
}

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

/**
 * @deprecated getSession() returns locally-cached, unverified data.
 * Use getUser() instead, which validates the token server-side.
 * This wrapper first calls getUser() to re-validate the JWT, then returns
 * the locally-cached session — so it is safe to call for session metadata.
 */
export async function getSession() {
  const supabase = createClient();
  // Validate the JWT first — this is the secure check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return null;
  }
  // JWT is valid; locally-cached session data is now trustworthy
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function resetPassword(email: string, redirectTo?: string) {
  const supabase = createClient();

  const finalRedirectTo =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname.split("/").slice(0, 2).join("/")}/auth/reset-password`
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") +
        "/it/auth/reset-password");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: finalRedirectTo,
  });

  if (error) {
    throw error;
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}
