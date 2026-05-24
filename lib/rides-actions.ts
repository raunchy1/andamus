"use server";

/**
 * Ride search server actions.
 * @deprecated Import directly from `@/lib/server/actions/rides`.
 */

import { searchRides as _searchRides, type SearchFilters as _SearchFilters } from "@/lib/server/actions/rides";

export type SearchFilters = _SearchFilters;

export async function searchRides(filters: SearchFilters) {
  return _searchRides(filters);
}
