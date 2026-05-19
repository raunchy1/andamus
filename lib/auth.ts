"use client";

import { createClient } from "@/lib/supabase/client";

const VALID_LOCALES = ["it", "en", "de"] as const;

function getCurrentLocale(): string {
  if (typeof window === "undefined") return "it";
  const seg = window.location.pathname.split("/")[1];
  return VALID_LOCALES.includes(seg as "it" | "en" | "de") ? seg : "it";
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const locale = getCurrentLocale();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined"
        ? `${window.location.origin}/${locale}/auth/callback`
        : "/it/auth/callback",
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  const supabase = createClient();
  const locale = getCurrentLocale();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  if (typeof window !== "undefined") {
    window.location.href = `/${locale}/`;
  }
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    // console.error("Error getting user:", error);
    return null;
  }
  
  return user;
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    // console.error("Error getting session:", error);
    return null;
  }
  
  return session;
}
