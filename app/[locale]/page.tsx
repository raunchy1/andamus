import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from "@/lib/supabase/server";
import { getTodayRides } from "@/lib/server/data/rides";
import HomePageClient from '@/components/HomePageClient';

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  const translations = {
    badge: t('heroBadge'),
    heroTitle: t('heroTitle'),
    heroTitleHighlight: t('heroTitleHighlight'),
    heroSubtitle: t('heroSubtitle'),
    heroDescription: t('heroDescription'),
    heroFree: t('heroFree'),
    heroFrom: t('heroFrom'),
    heroTo: t('heroTo'),
    heroDate: t('heroDate'),
    heroSearchButton: t('heroSearchButton'),
    heroCityPlaceholder: t('heroCityPlaceholder'),
    heroFromPlaceholder: t('heroFromPlaceholder'),
    todayRides: t('todayRides'),
    seeAll: t('seeAll'),
    today: t('today'),
    free: t('free'),
    car: t('car'),
    noRidesToday: t('noRidesToday'),
    searchOtherDates: t('searchOtherDates'),
    offerRide: t('offerRide'),
    yourTrips: t('yourTrips'),
    departuresConfirmed: t('departuresConfirmed'),
    feature1Title: t('feature1Title'),
    feature1Description: t('feature1Description'),
    feature2Title: t('feature2Title'),
    feature2Description: t('feature2Description'),
    feature3Title: t('feature3Title'),
    feature3Description: t('feature3Description'),
    ctaTitle: t('ctaTitle'),
    ctaDescription: t('ctaDescription'),
    welcomeBack: t('welcomeBack'),
  };

  let todayRides: any[] = [];
  let savedRoutes: any[] = [];
  let claims: any = null;

  try {
    const supabase = await createClient();
    // Identity comes from the JWT via getClaims() — local verification, no
    // Auth API round trip. This lets the rides and saved-routes queries run
    // in a single parallel batch instead of two sequential ones.
    const { data: claimsData } = await supabase.auth.getClaims();
    claims = claimsData?.claims ?? null;
    const userId = typeof claims?.sub === "string" ? claims.sub : null;

    const [ridesRes, savedRes] = await Promise.allSettled([
      getTodayRides(5),
      userId
        ? supabase
            .from("ride_alerts")
            .select("id, from_city, to_city, created_at")
            .eq("user_id", userId)
            .is("start_date", null)
            .is("end_date", null)
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    if (ridesRes.status === "fulfilled") {
      todayRides = ridesRes.value;
    } else {
      console.error("[home] Failed to fetch today rides:", ridesRes.reason);
    }

    if (savedRes.status === "fulfilled") {
      savedRoutes = (savedRes.value as { data: any[] | null }).data || [];
    } else {
      console.error("[home] Failed to fetch saved routes:", savedRes.reason);
    }
  } catch (err) {
    console.error("[home] Unexpected error in Server Component:", err);
  }

  const meta = claims?.user_metadata ?? {};
  const userName = meta.name || meta.full_name || (typeof claims?.email === "string" ? claims.email.split("@")[0] : "") || "";
  const userAvatar = meta.avatar_url || meta.picture || null;

  return (
    <HomePageClient
      locale={locale}
      translations={translations}
      initialRides={todayRides}
      initialUserName={userName}
      initialUserAvatar={userAvatar}
      initialSavedRoutes={savedRoutes}
    />
  );
}
