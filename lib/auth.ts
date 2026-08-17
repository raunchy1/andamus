"use client";

import { createClient } from "@/lib/supabase/client";

export type { User, Session } from "@supabase/supabase-js";

function getCallbackPath(redirectTo?: string): string {
  if (typeof window === "undefined") {
    return `${process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app"}/auth/callback`;
  }

  const origin = window.location.origin;
  const locale = window.location.pathname.split("/")[1];
  const safeLocale = ["it", "en"].includes(locale) ? locale : "it";

  let targetPath = redirectTo || `${window.location.pathname}${window.location.search}`;

  if (!targetPath.startsWith("/")) {
    targetPath = "/" + targetPath;
  }

  // Prepend locale prefix if not already present in the target path
  if (!/^\/(it|en)(\/|$)/.test(targetPath)) {
    targetPath = `/${safeLocale}${targetPath}`;
  }

  // Prevent infinite login loops on callback pages
  const safeTarget = targetPath.includes("/auth/callback") || targetPath.includes("/auth/auth-code-error")
    ? `/${safeLocale}/profilo`
    : targetPath;

  return `${origin}/auth/callback?next=${encodeURIComponent(safeTarget)}`;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode?: "popup" | "redirect";
            callback: (response: { code?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestCode: () => void };
        };
      };
    };
  }
}

let googleIdentityReady: Promise<void> | null = null;

/** Preload GIS so the popup can open synchronously on the user's click (user-gesture). */
export function preloadGoogleIdentity(): void {
  if (typeof window === "undefined") return;
  if (window.google?.accounts?.oauth2 || googleIdentityReady) return;

googleIdentityReady = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity"));
    document.head.appendChild(script);
  });

  googleIdentityReady.catch(() => {
    googleIdentityReady = null;
  });
}

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser"));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  preloadGoogleIdentity();
  return googleIdentityReady || Promise.reject(new Error("Google Identity not loading"));
}

/**
 * Preferred path: Google Identity Services popup bound to this site's origin.
 * Users see "Accesează andamus.vercel.app" (or the verified app name "Andamus")
 * instead of the Supabase project subdomain.
 *
 * Falls back to classic Supabase OAuth redirect if GIS / server exchange fails.
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ method: "gis" | "oauth" }> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const supabase = createClient();

  // If GIS is already loaded, open the popup immediately (keeps user-gesture).
  // If not, wait once then fall back to full-page OAuth (popups require a sync gesture).
  if (clientId && window.google?.accounts?.oauth2) {
    try {
      const authCode = await new Promise<string>((resolve, reject) => {
        const client = window.google!.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: (response) => {
            if (response.error || !response.code) {
              reject(
                new Error(
                  response.error_description || response.error || "Google sign-in was cancelled"
                )
              );
              return;
            }
            resolve(response.code);
          },
          error_callback: (error) => {
            reject(new Error(error.message || error.type || "Google sign-in failed"));
          },
        });
        client.requestCode();
      });

      const exchangeRes = await fetch("/api/auth/google-id-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode }),
      });
      const exchangeJson = (await exchangeRes.json()) as { id_token?: string; error?: string };
      if (!exchangeRes.ok || !exchangeJson.id_token) {
        throw new Error(exchangeJson.error || "Failed to complete Google sign-in");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: exchangeJson.id_token,
      });
      if (error) throw error;

      return { method: "gis" };
    } catch (err) {
      console.warn("[auth] GIS Google sign-in failed, falling back to OAuth redirect", err);
    }
  } else if (clientId) {
    // Warm the script for the next click.
    void loadGoogleIdentityScript().catch(() => undefined);
  }

  const stateRes = await fetch("/api/auth/oauth-state", { method: "POST" });
  if (!stateRes.ok) {
    throw new Error("Failed to initialize OAuth session");
  }
  const { state } = (await stateRes.json()) as { state: string };

  const callbackUrl = getCallbackPath(redirectTo);
  const separator = callbackUrl.includes("?") ? "&" : "?";
  const redirectWithState = `${callbackUrl}${separator}state=${encodeURIComponent(state)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectWithState,
    },
  });

  if (error) throw error;
  return { method: "oauth" };
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
