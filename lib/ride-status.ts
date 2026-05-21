import { isRideExpired, getAppNow } from "./date-utils";

export type ComputedRideStatus = "upcoming" | "active" | "completed" | "cancelled";

/**
 * Compute the effective status of a ride based on its stored status
 * and whether the departure time has passed.
 *
 * This is the single source of truth for ride status across the app.
 * Always use this instead of checking date strings directly.
 */
export function computeRideStatus(
  storedStatus: string,
  rideDate: string,
  rideTime: string
): ComputedRideStatus {
  if (storedStatus === "cancelled") return "cancelled";
  if (isRideExpired(rideDate, rideTime)) return "completed";
  // A ride is "active" if it's today; "upcoming" if it's in the future
  const { date: today } = getAppNow();
  if (rideDate === today) return "active";
  return "upcoming";
}

/**
 * Check if a ride can be booked.
 * A ride is bookable only if it's upcoming or active (not completed/cancelled)
 * AND the departure time hasn't passed yet.
 */
export function isRideBookable(
  storedStatus: string,
  rideDate: string,
  rideTime: string
): boolean {
  const computed = computeRideStatus(storedStatus, rideDate, rideTime);
  return computed === "upcoming" || computed === "active";
}

/**
 * Check if reviews can be submitted for a ride.
 * Reviews are only allowed after the ride has completed.
 */
export function canReviewRide(
  storedStatus: string,
  rideDate: string,
  rideTime: string
): boolean {
  const computed = computeRideStatus(storedStatus, rideDate, rideTime);
  return computed === "completed";
}

/**
 * Human-readable status label with i18n key.
 */
export function getRideStatusLabel(status: ComputedRideStatus): string {
  switch (status) {
    case "upcoming":
      return "In programma";
    case "active":
      return "Oggi";
    case "completed":
      return "Completata";
    case "cancelled":
      return "Annullata";
    default:
      return status;
  }
}

/**
 * CSS color class for status badges.
 */
export function getRideStatusColor(status: ComputedRideStatus): string {
  switch (status) {
    case "upcoming":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "completed":
      return "bg-white/10 text-white/60 border-white/20";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-white/10 text-white/60";
  }
}
