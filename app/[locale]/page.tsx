import { getTranslations, setRequestLocale } from 'next-intl/server';
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

  return <HomePageClient locale={locale} translations={translations} />;
}
