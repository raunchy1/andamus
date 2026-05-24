"use client";

import { useState, useCallback, useRef } from "react";
import { searchRides, type SearchFilters } from "@/lib/server/actions/rides";

export interface Ride {
  id: string;
  driver_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  created_at?: string;
  smoking_allowed?: boolean | null;
  pets_allowed?: boolean | null;
  large_luggage?: boolean | null;
  music_preference?: "quiet" | "music" | "talk" | null;
  women_only?: boolean | null;
  students_only?: boolean | null;
  profiles: {
    name: string;
    avatar_url: string | null;
    rating: number;
    review_count?: number | null;
    rides_count?: number | null;
    phone_verified?: boolean;
    id_verified?: boolean;
  };
}

interface UseRidesReturn {
  rides: Ride[];
  loading: boolean;
  error: string | null;
  fetchRides: (filters: SearchFilters) => Promise<void>;
  clearError: () => void;
}

/**
 * Client-side hook for fetching rides with loading/error states.
 */
export function useRides(): UseRidesReturn {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchRides = useCallback(async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchRides(filters);
      if (isMountedRef.current) {
        setRides(results as Ride[]);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Errore durante la ricerca.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Note: we don't use useEffect for mount tracking here because
  // the consumer controls when fetchRides is called.
  // We set a simple mounted flag that stays true for the hook lifetime.
  isMountedRef.current = true;

  return {
    rides,
    loading,
    error,
    fetchRides,
    clearError,
  };
}
