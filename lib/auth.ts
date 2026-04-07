"use client";

import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle() {
  const supabase = createClient();
  
  // Use dynamic redirect URL based on environment
  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") + "/auth/callback";
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });
  
  if (error) {
    throw error;
  }
}

export async function signInWithFacebook() {
  const supabase = createClient();
  
  // Use dynamic redirect URL based on environment
  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") + "/auth/callback";
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo,
    },
  });
  
  if (error) {
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        name: fullName,
      },
      // Email confirmation is handled by Supabase
      emailRedirectTo: typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") + "/auth/callback",
    },
  });
  
  if (error) {
    throw error;
  }
  
  // If auto-confirm is enabled, the user will be logged in immediately
  // Otherwise, they need to confirm their email
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
  
  // Redirect to home
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    return null;
  }
  
  return user;
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    return null;
  }
  
  return session;
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== "undefined"
      ? `${window.location.origin}/auth/reset-password`
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") + "/auth/reset-password",
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
