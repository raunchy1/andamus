"use client";

import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();
  
  const finalRedirectTo = redirectTo || (typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname.split('/').slice(0, 2).join('/')}/auth/callback`
    : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") + "/it/auth/callback");
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: finalRedirectTo,
    },
  });
  
  if (error) {
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string, redirectTo?: string) {
  const supabase = createClient();
  
  const finalRedirectTo = redirectTo || (typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname.split('/').slice(0, 2).join('/')}/auth/callback`
    : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") + "/it/auth/callback");
  
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
  
  // Hard reload to clear all state and re-run middleware
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

export async function resetPassword(email: string, redirectTo?: string) {
  const supabase = createClient();
  
  const finalRedirectTo = redirectTo || (typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname.split('/').slice(0, 2).join('/')}/auth/reset-password`
    : (process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app") + "/it/auth/reset-password");
  
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
