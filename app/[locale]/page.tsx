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
  let user: any = null;

  try {
    const supabase = await createClient();
    const [ridesRes, userRes] = await Promise.allSettled([
      getTodayRides(5),
      supabase.auth.getUser(),
    ]);

    if (ridesRes.status === "fulfilled") {
      todayRides = ridesRes.value;
    } else {
      console.error("[home] Failed to fetch today rides:", ridesRes.reason);
    }

    if (userRes.status === "fulfilled") {
      user = userRes.value.data?.user || null;
    } else {
      console.error("[home] Failed to fetch user:", userRes.reason);
    }
  } catch (err) {
    console.error("[home] Unexpected error in Server Component:", err);
  }

  let savedRoutes: any[] = [];
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ride_alerts")
      .select("id, from_city, to_city, created_at")
      .eq("user_id", user.id)
      .is("start_date", null)
      .is("end_date", null)
      .order("created_at", { ascending: false })
      .limit(20);
    savedRoutes = data || [];
  }

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

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
