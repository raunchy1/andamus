import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PremiumClient } from "./_components/PremiumClient";

/**
 * Premium is a recurring digital subscription sold through Stripe's hosted
 * checkout — an external payment page. Google Play's Payments policy requires
 * digital subscriptions consumed in an Android app to use Play Billing, and
 * specifically prohibits linking users out to pay. Ride payments are not
 * affected: transport is a physical service, outside that policy.
 *
 * Until Play Billing is wired up, the Android build ships with Premium off.
 * Set NEXT_PUBLIC_PREMIUM_ENABLED=true to keep selling it on the web PWA.
 *
 * The gate lives on the page rather than in a layout: a redirect() from
 * app/[locale]/premium/layout.tsx did not take effect (verified against a
 * production build), while this does. /api/stripe/checkout carries the same
 * gate so the endpoint cannot be called directly.
 */
const PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_ENABLED === "true";

export default async function PremiumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!PREMIUM_ENABLED) redirect(`/${locale}`);

  return <PremiumClient />;
}
