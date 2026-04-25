"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Car, 
  Users, 
  TreePine, 
  Route, 
  Award,
  Calendar,
  TrendingUp,
  Download,
  Trophy,
  MapPin,
  Clock,
  Check
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDistanceBetweenCities, calculateCO2Saved } from "@/lib/sardinia-cities";
import { getUserBadges, type Badge } from "@/lib/gamification";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";
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

export default function StatisticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("stats");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Data states
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activeTab, setActiveTab] = useState<"driver" | "passenger">("driver");
  
  // Filter states
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

        // Load profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(profileData);

        // Load my rides (as driver)
        const { data: ridesData } = await supabase
          .from("rides")
          .select(`*, bookings(count)`)
          .eq("driver_id", currentUser.id)
          .order("date", { ascending: false });
        
        setMyRides(ridesData || []);

        // Load my bookings (as passenger)
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`
            *,
            rides(from_city, to_city, date, time, price, driver_id)
          `)
          .eq("passenger_id", currentUser.id)
          .order("created_at", { ascending: false });
        
        setMyBookings(bookingsData || []);

        // Load badges
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

  // Calculate statistics
  const stats = useMemo(() => {
    const completedRides = myRides.filter(r => r.status === 'active' || new Date(r.date) < new Date());
    const completedBookings = myBookings.filter(b => b.status === 'confirmed');
    
    // Calculate total distance
    let totalDistance = 0;
    const ridesWithDistance = [...completedRides, ...completedBookings.map(b => b.rides)];
    
    ridesWithDistance.forEach(ride => {
      const dist = getDistanceBetweenCities(ride.from_city, ride.to_city);
      if (dist) {
        totalDistance += dist;
      }
    });

    // Calculate passengers helped (bookings count for rides)
    const passengersHelped = completedRides.reduce((sum, ride) => sum + (ride.bookings_count || 0), 0);
    
    // CO2 saved
    const co2Saved = calculateCO2Saved(totalDistance, passengersHelped);

    // Estimated earnings
    const totalEarnings = myRides.reduce((sum, ride) => sum + (ride.price || 0), 0);

    // Booking acceptance rate
    const totalBookingRequests = myRides.reduce((sum, ride) => sum + (ride.bookings_count || 0), 0);
    // We don't have confirmed count per ride in this data, so we'll use a proxy
    const acceptanceRate = totalBookingRequests > 0
      ? Math.round((passengersHelped / totalBookingRequests) * 100)
      : 0;

    // Activity data for chart (last 12 months)
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
        totale: monthRides + monthBookings
      });
    }

    // Favorite routes
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
      passengersHelped,
      totalPoints: profile?.points || 0,
      badgesCount: badges.length,
      totalEarnings,
      acceptanceRate,
      activityData,
      favoriteRoutes
    };
  }, [myRides, myBookings, profile, badges, locale]);

  // Filter history
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

  // Unique routes for filter
  const uniqueRoutes = useMemo(() => {
    const routes = new Set<string>();
    [...myRides, ...myBookings.map(b => b.rides)].forEach(ride => {
      routes.add(`${ride.from_city} → ${ride.to_city}`);
    });
    return Array.from(routes).sort();
  }, [myRides, myBookings]);

  // Years for filter
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    [...myRides, ...myBookings.map(b => b.rides)].forEach(item => {
      yearsSet.add(item.date.slice(0, 4));
    });
    return Array.from(yearsSet).sort().reverse();
  }, [myRides, myBookings]);

  const generatePDFReport = () => {
    const reportLines = [
      t('reportTitle'),
      "=".repeat(40),
      "",
      `${t('user')}: ${profile?.name || t('user')}`,
      `${t('reportDate')}: ${new Date().toLocaleDateString(locale)}`,
      "",
      t('generalStats'),
      "-".repeat(40),
      `${t('totalKm')}: ${stats.totalDistance}`,
      `${t('co2Saved')}: ${stats.co2Saved} kg`,
      `${t('ridesAsDriver')}: ${stats.ridesAsDriver}`,
      `${t('ridesAsPassenger')}: ${stats.ridesAsPassenger}`,
      `${t('peopleHelped')}: ${stats.passengersHelped}`,
      `${t('totalPoints')}: ${stats.totalPoints}`,
      `${t('badgesUnlocked')}: ${stats.badgesCount}`,
      "",
      t('favoriteRoutesTitle'),
      "-".repeat(40),
      ...stats.favoriteRoutes.map((r, i) => `${i + 1}. ${r.name} (${r.count} ${t('times')})`),
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

  if (error) {
    return <div className="p-8 text-center text-error">Errore nel caricamento. Riprova.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e63946]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/profilo"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('backToProfile')}
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#e63946]" />
            {t('myStats')}
          </h1>
          <p className="text-white/60 mt-2">{t('subtitle')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <StatCard 
            icon={<Route className="w-6 h-6 text-blue-400" />}
            value={stats.totalDistance}
            label={t('kmTraveled')}
            suffix=" km"
          />
          <StatCard 
            icon={<TreePine className="w-6 h-6 text-green-400" />}
            value={stats.co2Saved}
            label={t('co2Saved')}
            suffix=" kg"
          />
          <StatCard 
            icon={<Car className="w-6 h-6 text-[#e63946]" />}
            value={stats.ridesAsDriver}
            label={t('asDriver')}
          />
          <StatCard 
            icon={<Users className="w-6 h-6 text-purple-400" />}
            value={stats.ridesAsPassenger}
            label={t('asPassenger')}
          />
          <StatCard 
            icon={<Users className="w-6 h-6 text-orange-400" />}
            value={stats.passengersHelped}
            label={t('peopleHelped')}
          />
          <StatCard 
            icon={<Trophy className="w-6 h-6 text-yellow-400" />}
            value={stats.badgesCount}
            label={t('badgesUnlocked')}
          />
          <StatCard 
            icon={<Download className="w-6 h-6 text-pink-400" />}
            value={stats.totalEarnings}
            label={t('estimatedEarnings')}
            suffix="€"
          />
          <StatCard 
            icon={<Check className="w-6 h-6 text-cyan-400" />}
            value={stats.acceptanceRate}
            label={t('acceptanceRate')}
            suffix="%"
          />
        </div>

        {/* Activity Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#e63946]" />
            {t('activityLast12Months')}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111111', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="driver" name={t('driver')} fill="#e63946" radius={[4, 4, 0, 0]} />
                <Bar dataKey="passenger" name={t('passenger')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Favorite Routes */}
        {stats.favoriteRoutes.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#e63946]" />
              {t('favoriteRoutes')}
            </h2>
            <div className="space-y-3">
              {stats.favoriteRoutes.map((route, index) => (
                <div 
                  key={route.name}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                        index === 1 ? 'bg-gray-400/20 text-on-surface-variant' : 
                        'bg-orange-600/20 text-orange-400'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{route.name}</p>
                      <p className="text-white/50 text-sm">
                        {t('lastTime')}: {new Date(route.lastDate).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{route.count}</p>
                    <p className="text-white/50 text-sm">{t('times', { count: route.count })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#e63946]" />
              {t('fullHistory')}
            </h2>
            
            {/* Export Button */}
            <button
              onClick={generatePDFReport}
              className="flex items-center justify-center gap-2 bg-primary text-on-primary rounded-full px-6 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {t('downloadReport')}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("driver")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "driver"
                  ? "bg-[#e63946] text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <Car className="w-4 h-4" />
              {t('asDriver')}
            </button>
            <button
              onClick={() => setActiveTab("passenger")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "passenger"
                  ? "bg-[#e63946] text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <Users className="w-4 h-4" />
              {t('asPassenger')}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#e63946] outline-none"
            >
              <option value="all">{t('allYears')}</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#e63946] outline-none"
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
            
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#e63946] outline-none"
            >
              <option value="all">{t('allRoutes')}</option>
              {uniqueRoutes.map(route => (
                <option key={route} value={route}>{route}</option>
              ))}
            </select>
          </div>

          {/* History List */}
          <div className="space-y-2">
            {filteredHistory.length === 0 ? (
              <p className="text-center text-white/40 py-8">{t('noRidesFound')}</p>
            ) : (
              filteredHistory.map((item: HistoryItem) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-[#e63946]" />
                      <div className="h-8 w-0.5 bg-white/20" />
                      <div className="h-2 w-2 rounded-full bg-white/40" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {item.from_city} → {item.to_city}
                      </p>
                      <p className="text-white/50 text-sm">
                        {new Date(item.date).toLocaleDateString(locale, { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                        {item.time && ` ${t('at')} ${item.time.slice(0, 5)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {item.price === 0 ? t('free') : `${item.price}€`}
                    </p>
                    <p className={`text-xs ${
                      item.status === 'confirmed' ? 'text-green-400' : 
                      item.status === 'pending' ? 'text-yellow-400' : 
                      'text-white/50'
                    }`}>
                      {item.status === 'confirmed' ? t('confirmed') : 
                       item.status === 'pending' ? t('pendingStatus') : 
                       t('completed')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Achievements Timeline */}
        {badges.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#e63946]" />
              {t('achievementHistory')}
            </h2>
            <div className="space-y-4">
              {badges.map((badge) => {
                const badgeDetails = getBadgeDetails(badge.type || 'unknown', t);
                return (
                  <div 
                    key={badge.id}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl"
                  >
                    <div className={`w-12 h-12 rounded-xl ${badgeDetails.color} flex items-center justify-center text-2xl`}>
                      {badgeDetails.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{badgeDetails.name}</p>
                      <p className="text-white/50 text-sm">{badgeDetails.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-sm">
                        {new Date(badge.earned_at || '2024-01-01').toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Helper component for stat cards
function StatCard({ 
  icon, 
  value, 
  label, 
  suffix = "" 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  suffix?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}{suffix}</p>
      <p className="text-white/60 text-xs">{label}</p>
    </div>
  );
}

// Helper function for badge details
function getBadgeDetails(type: string, translate: ReturnType<typeof useTranslations>) {
  const badges: Record<string, { name: string; description: string; icon: string; color: string }> = {
    'first_ride': {
      name: translate('badgeFirstRideName'),
      description: translate('badgeFirstRideDesc'),
      icon: "🚗",
      color: "bg-blue-500",
    },
    'welcome': {
      name: translate('badgeWelcomeName'),
      description: translate('badgeWelcomeDesc'),
      icon: "👋",
      color: "bg-green-500",
    },
    'verified': {
      name: translate('badgeVerifiedName'),
      description: translate('badgeVerifiedDesc'),
      icon: "✅",
      color: "bg-purple-500",
    },
    'five_stars': {
      name: translate('badgeFiveStarsName'),
      description: translate('badgeFiveStarsDesc'),
      icon: "⭐",
      color: "bg-yellow-500",
    },
    'habitue': {
      name: translate('badgeHabitueName'),
      description: translate('badgeHabitueDesc'),
      icon: "🎯",
      color: "bg-orange-500",
    },
    'ambassador': {
      name: translate('badgeAmbassadorName'),
      description: translate('badgeAmbassadorDesc'),
      icon: "🏆",
      color: "bg-red-500",
    },
  };
  
  return badges[type] || {
    name: type,
    description: "",
    icon: "🏅",
    color: "bg-surface-variant",
  };
}
