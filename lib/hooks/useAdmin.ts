"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function getEnvAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getEnvAdminEmails().includes(email.toLowerCase().trim());
}

interface UseAdminReturn {
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Client-side admin check hook.
 * Uses only env-based admin emails (NEXT_PUBLIC_ADMIN_EMAILS).
 * For server-side admin guards, use `requireAdmin()` from `@/lib/server/guards/admin`.
 */
export function useAdmin(): UseAdminReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const check = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!error && data.user?.email && isAdminEmail(data.user.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    check();

    return () => {
      mounted = false;
    };
  }, []);

  return { isAdmin, loading };
}
