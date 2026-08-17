import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CancelClient } from "./_components/Client";

/** Gated alongside /premium — see the note in app/[locale]/premium/page.tsx. */
const PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_ENABLED === "true";

export default async function PremiumCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!PREMIUM_ENABLED) redirect(`/${locale}`);
  return <CancelClient />;
}
