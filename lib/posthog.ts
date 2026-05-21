import posthog from "posthog-js";

function getClient() {
  if (typeof window === "undefined") return null;
  // posthog-js is already initialized by PostHogProvider
  return posthog;
}

export function identifyUser(
  userId: string,
  props?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return;
  ph.identify(userId, props);
}

export function resetUser() {
  const ph = getClient();
  if (!ph) return;
  ph.reset();
}

export function captureEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  const ph = getClient();
  if (!ph) return;
  ph.capture(eventName, properties);
}

export function capturePageview(url?: string) {
  const ph = getClient();
  if (!ph) return;
  ph.capture("$pageview", url ? { $current_url: url } : undefined);
}

// Product analytics events
export const ProductAnalytics = {
  signupStarted: (method: string) =>
    captureEvent("signup_started", { method }),

  signupCompleted: (method: string) =>
    captureEvent("signup_completed", { method }),

  rideSearch: (params: {
    origin?: string;
    destination?: string;
    hasFilters: boolean;
  }) => captureEvent("ride_search", params),

  rideOfferCreated: (rideId: string, origin: string, destination: string) =>
    captureEvent("ride_offer_created", { ride_id: rideId, origin, destination }),

  bookingRequested: (rideId: string, price: number) =>
    captureEvent("booking_requested", { ride_id: rideId, price }),

  bookingAccepted: (rideId: string, bookingId: string) =>
    captureEvent("booking_accepted", { ride_id: rideId, booking_id: bookingId }),

  bookingRejected: (rideId: string, bookingId: string) =>
    captureEvent("booking_rejected", { ride_id: rideId, booking_id: bookingId }),

  chatOpened: (bookingId: string) =>
    captureEvent("chat_opened", { booking_id: bookingId }),

  reviewSubmitted: (rideId: string, rating: number) =>
    captureEvent("review_submitted", { ride_id: rideId, rating }),

  premiumCheckoutStarted: (plan: string) =>
    captureEvent("premium_checkout_started", { plan }),

  premiumCheckoutCompleted: (plan: string, value: number) =>
    captureEvent("premium_checkout_completed", { plan, value, currency: "EUR" }),

  // Device / context
  setDeviceContext: (deviceType: string, locale: string) =>
    captureEvent("$set", {
      device_type: deviceType,
      locale,
    }),
};
