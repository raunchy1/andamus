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

export const trackEvent = (
  eventName: string,
  params?: Record<string, unknown>
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
};

// Track key events throughout the app
export const Analytics = {
  rideCreated: (origin: string, destination: string) =>
    trackEvent("ride_created", { origin, destination }),

  rideBooked: (rideId: string, price: number) =>
    trackEvent("ride_booked", { ride_id: rideId, value: price }),

  userRegistered: () => trackEvent("sign_up", { method: "email" }),

  googleLogin: () => trackEvent("login", { method: "google" }),

  searchPerformed: (origin: string, destination: string) =>
    trackEvent("search", { origin, destination }),

  premiumUpgrade: (plan: string, value: number) =>
    trackEvent("purchase", {
      transaction_id: Date.now().toString(),
      value,
      currency: "EUR",
      items: [{ item_name: plan }],
    }),
};
