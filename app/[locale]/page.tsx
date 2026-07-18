import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getTodayRides } from "@/lib/server/data/rides";
import HomePageClient from '@/components/HomePageClient';

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const translations = {
    kicker: t('kicker'),
    headline: t('headline'),
    description: t('description'),
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
    departuresConfirmed: t('departuresConfirmed'),
    close: tCommon('close'),
    savedRoutes: t('savedRoutes'),
    routeRemoved: t('routeRemoved'),
    routeRemoveError: t('routeRemoveError'),
    howItWorksTitle: t('howItWorks.title'),
    howItWorksStep1: t('howItWorks.step1.title'),
    howItWorksStep2: t('howItWorks.step2.title'),
    howItWorksStep3: t('howItWorks.step3.title'),
  };

  let todayRides: any[] = [];

  try {
    todayRides = await getTodayRides(5);
  } catch (err) {
    console.error("[home] Failed to fetch today rides:", err);
  }

  return (
    <HomePageClient
      locale={locale}
      translations={translations}
      initialRides={todayRides}
    />
  );
}
