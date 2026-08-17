import { notFound } from "next/navigation";

/**
 * Premium is a recurring digital subscription sold through Stripe's hosted
 * checkout — an external payment page. Google Play's Payments policy requires
 * digital subscriptions consumed inside an Android app to use Play Billing,
 * and specifically prohibits linking users out to pay. Ride payments are not
 * affected: transport is a physical service and falls outside that policy.
 *
 * Until Play Billing is wired up, the Android build ships with Premium off.
 * Set NEXT_PUBLIC_PREMIUM_ENABLED=true to keep selling it on the web PWA.
 */
const PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_ENABLED === "true";

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  if (!PREMIUM_ENABLED) notFound();
  return <>{children}</>;
}
