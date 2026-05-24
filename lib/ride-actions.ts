"use server";

/**
 * Ride creation server actions.
 * @deprecated Import directly from `@/lib/server/actions/rides`.
 */

import { createRide as _createRide, type CreateRideInput as _CreateRideInput } from "@/lib/server/actions/rides";

export type CreateRideInput = _CreateRideInput;

export async function createRide(input: CreateRideInput) {
  return _createRide(input);
}
