/**
 * Timezone-aware date utilities for the Andamus carpooling platform.
 *
 * The app operates in Europe/Rome (Sardegna, Italia).
 * All ride dates/times are stored as local Italian dates in PostgreSQL.
 * These helpers ensure consistent local-time comparisons across SSR and client.
 */

const APP_TIMEZONE = "Europe/Rome";

/** Get current date and time in the app's timezone (YYYY-MM-DD, HH:MM:SS). */
export function getAppNow() {
  const now = new Date();
  return {
    date: now.toLocaleDateString("sv-SE", { timeZone: APP_TIMEZONE }),
    time: now.toLocaleTimeString("sv-SE", {
      timeZone: APP_TIMEZONE,
      hour12: false,
    }),
    iso: now.toISOString(),
  };
}

/** Check whether a ride (date + time) has already departed. */
export function isRideExpired(rideDate: string, rideTime: string): boolean {
  const { date, time } = getAppNow();
  if (rideDate < date) return true;
  if (rideDate === date && rideTime < time) return true;
  return false;
}

/** Build a Supabase `.or()` string that excludes expired rides. */
export function buildNotExpiredOrFilter(
  dateField = "date",
  timeField = "time"
): string {
  const { date, time } = getAppNow();
  return `${dateField}.gt.${date},and(${dateField}.eq.${date},${timeField}.gte.${time})`;
}
