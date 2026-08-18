"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  Award,
  Car,
  Users,
  ShieldCheck,
  Star,
  Repeat,
  Medal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDistanceBetweenCities, calculateCO2Saved } from "@/lib/sardinia-cities";
import { getUserBadges, type Badge } from "@/lib/gamification";
import { toast } from "sonner";

const ActivityChart = dynamic(
  () => import("./_components/ActivityChart").then((m) => m.ActivityChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-sand-deep" /> }
);
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useTranslations, useLocale } from "next-intl";

interface Ride {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  status: string;
  created_at: string;
  bookings_count?: number;
}

interface Booking {
  id: string;
  ride_id: string;
  status: string;
  created_at: string;
  rides: {
    from_city: string;
    to_city: string;
    date: string;
    time: string;
    price: number;
    driver_id: string;
  };
}

interface HistoryItem {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  status: string;
  created_at: string;
}

/** Badge identity as icon + no colour. One family, one stroke weight. */
const BADGE_ICONS: Record<string, React.ElementType> = {
  first_ride: Car,
  welcome: Users,
  verified: ShieldCheck,
  five_stars: Star,
  habitue: Repeat,
  ambassador: Award,
};

export default function StatisticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("stats");
  const locale = useLocale();
  const [, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activeTab, setActiveTab] = useState<"driver" | "passenger">("driver");

  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedRoute, setSelectedRoute] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      setError(false);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push("/");
          return;
        }
        setUser(currentUser);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(profileData);

        const { data: ridesData } = await supabase
          .from("rides")
          .select(`*, bookings(count)`)
          .eq("driver_id", currentUser.id)
          .order("date", { ascending: false });

        setMyRides(ridesData || []);

        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`
            *,
            rides(from_city, to_city, date, time, price, driver_id)
          `)
          .eq("passenger_id", currentUser.id)
          .order("created_at", { ascending: false });

        setMyBookings(bookingsData || []);

        const badgesResult = await getUserBadges(currentUser.id);
        if (badgesResult.success) {
          setBadges(badgesResult.badges || []);
        }
      } catch (err) {
        console.error('[statistiche] loadData error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  /**
   * Every figure below traces back to a row in Supabase. Two former tiles were
   * removed rather than restyled: "contributi stimati" summed the asking price
   * of every published ride whether or not anybody booked it, and the
   * acceptance rate divided a number by itself and therefore always read 100%.
   */
  const stats = useMemo(() => {
    const completedRides = myRides.filter(r => r.status === 'active' || new Date(r.date) < new Date());
    const completedBookings = myBookings.filter(b => b.status === 'confirmed');

    let totalDistance = 0;
    // CO2 is accumulated per ride, so each trip is credited with the people who
    // actually shared it. Multiplying total distance by total passengers, as
    // this page used to, cross-multiplied unrelated trips and inflated the
    // figure several times over.
    let co2Saved = 0;

    completedRides.forEach(ride => {
      const dist = getDistanceBetweenCities(ride.from_city, ride.to_city);
      if (dist) {
        totalDistance += dist;
        co2Saved += calculateCO2Saved(dist, ride.bookings_count || 0);
      }
    });

    completedBookings.forEach(booking => {
      const dist = getDistanceBetweenCities(booking.rides.from_city, booking.rides.to_city);
      if (dist) {
        totalDistance += dist;
        co2Saved += calculateCO2Saved(dist, 1);
      }
    });

    co2Saved = Math.round(co2Saved * 10) / 10;

    // Bookings received on the user's own rides — not "people helped", which
    // would count requests that were never confirmed.
    const bookingsReceived = completedRides.reduce((sum, ride) => sum + (ride.bookings_count || 0), 0);

    const activityData = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);

      const monthRides = myRides.filter(r => r.date.startsWith(monthKey)).length;
      const monthBookings = myBookings.filter(b => b.rides.date.startsWith(monthKey)).length;

      activityData.push({
        month: date.toLocaleDateString(locale, { month: 'short' }),
        fullMonth: monthKey,
        driver: monthRides,
        passenger: monthBookings,
      });
    }

    const routeCounts: Record<string, { count: number; lastDate: string; from: string; to: string }> = {};

    [...completedRides, ...completedBookings.map(b => b.rides)].forEach(ride => {
      const routeKey = `${ride.from_city} → ${ride.to_city}`;
      if (!routeCounts[routeKey]) {
        routeCounts[routeKey] = { count: 0, lastDate: ride.date, from: ride.from_city, to: ride.to_city };
      }
      routeCounts[routeKey].count++;
      if (ride.date > routeCounts[routeKey].lastDate) {
        routeCounts[routeKey].lastDate = ride.date;
      }
    });

    const favoriteRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([name, data]) => ({ name, ...data }));

    return {
      totalDistance,
      co2Saved,
      ridesAsDriver: completedRides.length,
      ridesAsPassenger: completedBookings.length,
      bookingsReceived,
      totalPoints: (profile?.points as number) || 0,
      badgesCount: badges.length,
      activityData,
      activityTotal: activityData.reduce((s, m) => s + m.driver + m.passenger, 0),
      favoriteRoutes,
    };
  }, [myRides, myBookings, profile, badges, locale]);

  const filteredHistory = useMemo(() => {
    let items = activeTab === "driver" ? myRides : myBookings.map(b => ({
      id: b.id,
      from_city: b.rides.from_city,
      to_city: b.rides.to_city,
      date: b.rides.date,
      time: b.rides.time,
      price: b.rides.price,
      status: b.status,
      created_at: b.created_at
    }));

    if (selectedYear !== "all") {
      items = items.filter(item => item.date.startsWith(selectedYear));
    }

    if (selectedMonth !== "all") {
      items = items.filter(item => item.date.slice(5, 7) === selectedMonth);
    }

    if (selectedRoute !== "all") {
      const [from, to] = selectedRoute.split(" → ");
      items = items.filter(item => item.from_city === from && item.to_city === to);
    }

    return items;
  }, [activeTab, myRides, myBookings, selectedYear, selectedMonth, selectedRoute]);

  const uniqueRoutes = useMemo(() => {
    const routes = new Set<string>();
    [...myRides, ...myBookings.map(b => b.rides)].forEach(ride => {
      routes.add(`${ride.from_city} → ${ride.to_city}`);
    });
    return Array.from(routes).sort();
  }, [myRides, myBookings]);

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    [...myRides, ...myBookings.map(b => b.rides)].forEach(item => {
      yearsSet.add(item.date.slice(0, 4));
    });
    return Array.from(yearsSet).sort().reverse();
  }, [myRides, myBookings]);

  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const hasAnyActivity = myRides.length > 0 || myBookings.length > 0;

  const generateReport = () => {
    const reportLines = [
      t('reportTitle'),
      "=".repeat(40),
      "",
      `${t('user')}: ${(profile?.name as string) || t('user')}`,
      `${t('reportDate')}: ${new Date().toLocaleDateString(locale)}`,
      "",
      t('generalStats'),
      "-".repeat(40),
      `${t('totalKm')}: ${stats.totalDistance}`,
      `${t('co2Saved')}: ${stats.co2Saved} kg`,
      `${t('ridesAsDriver')}: ${stats.ridesAsDriver}`,
      `${t('ridesAsPassenger')}: ${stats.ridesAsPassenger}`,
      `${t('bookingsReceived')}: ${stats.bookingsReceived}`,
      `${t('totalPoints')}: ${stats.totalPoints}`,
      `${t('badgesUnlocked')}: ${stats.badgesCount}`,
      "",
      t('favoriteRoutesTitle'),
      "-".repeat(40),
      ...stats.favoriteRoutes.map((r, i) => `${i + 1}. ${r.name} (${t('timesCount', { count: r.count })})`),
      "",
      t('rideHistory'),
      "-".repeat(40),
      ...filteredHistory.map(item =>
        `${item.date} | ${item.from_city} → ${item.to_city} | ${item.price === 0 ? t('free') : item.price + '€'}`
      ),
    ];

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `andamus-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(t('reportDownloaded'));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-green" strokeWidth={1.5} />
        <span className="sr-only">{t('loadingStats')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-16 text-center md:px-0">
        <p className="text-sm text-ink">{t('loadError')}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-line px-5 text-sm font-medium text-ink transition-colors hover:bg-sand"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 pb-12 pt-6 md:px-0 md:pt-8">
      {/* Header */}
      <header className="mb-8">
        <Link
          href={`/${locale}/profilo`}
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {t('backToProfile')}
        </Link>
        <h1 className="mt-2 font-heading text-[26px] leading-tight text-ink sm:text-3xl">{t('myStats')}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t('subtitle')}</p>
      </header>

      {!hasAnyActivity ? (
        <section className="rounded-2xl border border-line bg-surface px-5 py-12 text-center">
          <h2 className="font-heading text-xl text-ink">{t('emptyTitle')}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{t('emptyBody')}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/${locale}/cerca`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-green px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t('emptySearch')}
            </Link>
            <Link
              href={`/${locale}/offri`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line px-5 text-sm font-medium text-ink transition-colors hover:bg-sand"
            >
              {t('emptyOffer')}
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Numbers. No icons, no tile colours — the figures carry themselves. */}
          <section className="mb-8 overflow-hidden rounded-2xl border border-line bg-surface">
            <h2 className="border-b border-line px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t('summaryTitle')}
            </h2>
            <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-3">
              {[
                { label: t('kmTraveled'), value: `${numberFormat.format(stats.totalDistance)} km` },
                { label: t('co2SavedEstimate'), value: `${numberFormat.format(stats.co2Saved)} kg` },
                { label: t('asDriver'), value: numberFormat.format(stats.ridesAsDriver) },
                { label: t('asPassenger'), value: numberFormat.format(stats.ridesAsPassenger) },
                { label: t('bookingsReceived'), value: numberFormat.format(stats.bookingsReceived) },
                { label: t('totalPoints'), value: numberFormat.format(stats.totalPoints) },
              ].map((item) => (
                <div key={item.label} className="bg-surface px-5 py-4">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{item.label}</dt>
                  <dd className="mt-1 font-heading text-2xl text-ink tabular-nums">{item.value}</dd>
                </div>
              ))}
            </dl>
            <p className="border-t border-line bg-surface px-5 py-3 text-xs leading-relaxed text-muted">
              {t('co2Note')}
            </p>
          </section>

          {/* Activity — drawn only when there is something to draw. */}
          {stats.activityTotal > 0 && (
            <section className="mb-8 rounded-2xl border border-line bg-surface">
              <h2 className="border-b border-line px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {t('activityLast12Months')}
              </h2>
              <div className="px-2 py-5 sm:px-4">
                <div className="h-56 w-full sm:h-64">
                  <ActivityChart
                    data={stats.activityData}
                    driverLabel={t("driver")}
                    passengerLabel={t("passenger")}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Favourite routes */}
          {stats.favoriteRoutes.length > 0 && (
            <section className="mb-8 rounded-2xl border border-line bg-surface">
              <h2 className="border-b border-line px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {t('favoriteRoutes')}
              </h2>
              <ol className="divide-y divide-line-soft">
                {stats.favoriteRoutes.map((route, index) => (
                  <li key={route.name} className="flex items-center gap-4 px-5 py-4">
                    <span className="w-5 shrink-0 font-heading text-lg text-faint tabular-nums" aria-hidden>
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{route.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t('lastTime')}: {new Date(route.lastDate).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-muted tabular-nums">
                      {t('timesCount', { count: route.count })}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* History */}
          <section className="mb-8 rounded-2xl border border-line bg-surface">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {t('fullHistory')}
              </h2>
              <button
                onClick={generateReport}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-xl border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-sand sm:min-h-[36px] sm:self-auto"
              >
                <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {t('downloadReport')}
              </button>
            </div>

            <div className="px-5 py-4">
              <div role="tablist" aria-label={t('historyTabsLabel')} className="flex gap-1 border-b border-line">
                {(["driver", "passenger"] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`-mb-px min-h-[44px] border-b-2 px-3 text-sm transition-colors ${
                      activeTab === tab
                        ? "border-green font-semibold text-ink"
                        : "border-transparent font-medium text-muted hover:text-ink"
                    }`}
                  >
                    {tab === "driver" ? t('asDriver') : t('asPassenger')}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="sr-only" htmlFor="filter-year">{t('allYears')}</label>
                <select
                  id="filter-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-green"
                >
                  <option value="all">{t('allYears')}</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <label className="sr-only" htmlFor="filter-month">{t('allMonths')}</label>
                <select
                  id="filter-month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-green"
                >
                  <option value="all">{t('allMonths')}</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNum = String(i + 1).padStart(2, '0');
                    const d = new Date(2024, i, 1);
                    return (
                      <option key={monthNum} value={monthNum}>
                        {d.toLocaleDateString(locale, { month: 'long' })}
                      </option>
                    );
                  })}
                </select>

                <label className="sr-only" htmlFor="filter-route">{t('allRoutes')}</label>
                <select
                  id="filter-route"
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-green"
                >
                  <option value="all">{t('allRoutes')}</option>
                  {uniqueRoutes.map(route => (
                    <option key={route} value={route}>{route}</option>
                  ))}
                </select>
              </div>
            </div>

            <ul className="divide-y divide-line-soft border-t border-line">
              {filteredHistory.length === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-muted">{t('noRidesFound')}</li>
              ) : (
                filteredHistory.map((item: HistoryItem) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.from_city} → {item.to_city}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {new Date(item.date).toLocaleDateString(locale, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        {item.time && ` ${t('at')} ${item.time.slice(0, 5)}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-ink tabular-nums">
                        {item.price === 0 ? t('free') : `${item.price}€`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {item.status === 'confirmed' ? t('confirmed') :
                          item.status === 'pending' ? t('pendingStatus') :
                            t('completed')}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Badges */}
          {badges.length > 0 && (
            <section className="rounded-2xl border border-line bg-surface">
              <h2 className="border-b border-line px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {t('achievementHistory')}
              </h2>
              <ul className="divide-y divide-line-soft">
                {badges.map((badge) => {
                  const type = badge.type || 'unknown';
                  const Icon = BADGE_ICONS[type] || Medal;
                  return (
                    <li key={badge.id} className="flex items-center gap-4 px-5 py-4">
                      <Icon className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{badgeName(type, t)}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">{badgeDescription(type, t)}</p>
                      </div>
                      {badge.earned_at && (
                        <p className="shrink-0 text-xs text-muted tabular-nums">
                          {new Date(badge.earned_at).toLocaleDateString(locale, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

type Translate = ReturnType<typeof useTranslations>;

const BADGE_KEYS: Record<string, { name: string; desc: string }> = {
  first_ride: { name: 'badgeFirstRideName', desc: 'badgeFirstRideDesc' },
  welcome: { name: 'badgeWelcomeName', desc: 'badgeWelcomeDesc' },
  verified: { name: 'badgeVerifiedName', desc: 'badgeVerifiedDesc' },
  five_stars: { name: 'badgeFiveStarsName', desc: 'badgeFiveStarsDesc' },
  habitue: { name: 'badgeHabitueName', desc: 'badgeHabitueDesc' },
  ambassador: { name: 'badgeAmbassadorName', desc: 'badgeAmbassadorDesc' },
};

function badgeName(type: string, translate: Translate): string {
  const keys = BADGE_KEYS[type];
  return keys ? translate(keys.name) : translate('badgeUnknownName');
}

function badgeDescription(type: string, translate: Translate): string {
  const keys = BADGE_KEYS[type];
  return keys ? translate(keys.desc) : translate('badgeUnknownDesc');
}
