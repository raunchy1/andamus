export const trackEvent = (
  eventName: string,
  params?: Record<string, unknown>
) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, params);
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
