import { captureEvent, identifyUser, ProductAnalytics } from "./posthog";

type GtagFn = (
  command: "event" | "config" | "js" | "set",
  eventName: string | Date,
  params?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

function gtagEvent(eventName: string, params?: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, params);
    }
  } catch {
    // Analytics failures must never crash the app
  }
}

// Dual-track: GA4 + PostHog
function track(eventName: string, params?: Record<string, unknown>) {
  gtagEvent(eventName, params);
  captureEvent(eventName, params);
}

export const Analytics = {
  rideCreated: (origin: string, destination: string) => {
    track("ride_created", { origin, destination });
    ProductAnalytics.rideOfferCreated("", origin, destination);
  },

  rideBooked: (rideId: string, price: number) => {
    track("ride_booked", { ride_id: rideId, value: price });
    ProductAnalytics.bookingRequested(rideId, price);
  },

  userRegistered: () => {
    track("sign_up", { method: "google" });
    ProductAnalytics.signupCompleted("google");
  },

  googleLogin: () => {
    track("login", { method: "google" });
  },

  searchPerformed: (origin: string, destination: string) => {
    track("search", { origin, destination });
    ProductAnalytics.rideSearch({
      origin,
      destination,
      hasFilters: !!(origin || destination),
    });
  },

  premiumUpgrade: (plan: string, value: number) => {
    track("purchase", {
      transaction_id: Date.now().toString(),
      value,
      currency: "EUR",
      items: [{ item_name: plan }],
    });
    ProductAnalytics.premiumCheckoutCompleted(plan, value);
  },

  // Onboarding funnel events
  onboardingStarted: () => {
    track("onboarding_started");
    ProductAnalytics.onboardingStepCompleted("started");
  },

  onboardingCompleted: () => {
    track("onboarding_completed");
    ProductAnalytics.onboardingStepCompleted("completed");
  },

  onboardingSkipped: () => {
    track("onboarding_skipped");
  },

  firstRidePublished: () => {
    track("first_ride_published");
    ProductAnalytics.activationEvent("first_ride_published");
  },

  firstBookingMade: () => {
    track("first_booking_made");
    ProductAnalytics.activationEvent("first_booking_made");
  },
};

export { identifyUser };
