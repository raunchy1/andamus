"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

/**
 * Unified auth hook for client components.
 * Provides the current user, loading state, and a refresh function.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refreshUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      setUser(data.user);
    } else {
      setUser(null);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (mounted) {
        setUser(!error && data.user ? data.user : null);
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (mounted) {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    refreshUser,
  };
}
