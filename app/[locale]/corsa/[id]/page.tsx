import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getRideById,
  getRideStops,
  getDriverReviews,
  getSimilarRides,
  getRideBookingForUser,
  getUpcomingActiveRides,
} from "@/lib/server/data/rides";
import { RideDetailClient } from "@/components/ride-detail/RideDetailClient";
import { PremiumRideCard } from "@/components/cerca/PremiumRideCard";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Search, ArrowLeft, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function RideDetailPage({ params }: Props) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const [ride, user] = await Promise.all([
    getRideById(id),
    createClient().then((s) => s.auth.getUser().then((r) => r.data.user)),
  ]);

  if (!ride) {
    const fallbackRides = await getUpcomingActiveRides(3);
    const tCerca = await getTranslations("cerca");
    
    // Format date helper to pass to PremiumRideCard
    const formatDate = (dStr: string) => {
      const d = new Date(dStr);
      return d.toLocaleDateString(locale === "it" ? "it-IT" : locale === "de" ? "de-DE" : "en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    };
    
    const todayStr = new Date().toISOString().split("T")[0];

    // Localized copywriting
    const content = {
      it: {
        title: "Passaggio non disponibile",
        desc: "Questo viaggio potrebbe essere stato completato, annullato o il conducente potrebbe aver aggiornato i dettagli.",
        searchCTA: "Trova un altro passaggio",
        backHome: "Torna alla Home",
        alternatives: "Tratte attive suggerite",
      },
      en: {
        title: "Ride not available",
        desc: "This ride might have been completed, cancelled, or the driver might have updated the details.",
        searchCTA: "Find another ride",
        backHome: "Back to Home",
        alternatives: "Suggested active rides",
      },
      de: {
        title: "Fahrt nicht verfügbar",
        desc: "Diese Fahrt wurde möglicherweise abgeschlossen, storniert oder der Fahrer hat die Details aktualisiert.",
        searchCTA: "Andere Fahrt suchen",
        backHome: "Zur Startseite",
        alternatives: "Empfohlene aktive Fahrten",
      }
    }[locale as "it" | "en" | "de"] || {
      title: "Ride not available",
      desc: "This ride might have been completed, cancelled, or the driver might have updated the details.",
      searchCTA: "Find another ride",
      backHome: "Back to Home",
      alternatives: "Suggested active rides",
    };

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f8f8f8] flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto space-y-12">
          
          {/* Header Actions */}
          <div className="flex justify-start">
            <Link 
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {content.backHome}
            </Link>
          </div>

          {/* Empathetic Glassmorphic Panel */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent p-8 sm:p-12 text-center shadow-2xl backdrop-blur-2xl">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#e63946]/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#f4a261]/10 rounded-full blur-[80px]" />

            <div className="relative z-10 space-y-6 max-w-lg mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e63946]/10 border border-[#e63946]/20 text-[#e63946] mx-auto animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-heading font-black tracking-tighter sm:text-4xl text-[#f8f8f8]">
                  {content.title}
                </h1>
                <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                  {content.desc}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  href={`/${locale}/cerca`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e63946] to-[#f4a261] px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#e63946]/20 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <Search className="w-4 h-4" />
                  {content.searchCTA}
                </Link>
              </div>
            </div>
          </div>

          {/* Alternative Suggestions */}
          {fallbackRides.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h2 className="text-xl font-heading font-bold tracking-tight text-[#f8f8f8]">
                  ✨ {content.alternatives}
                </h2>
                <Link 
                  href={`/${locale}/cerca`} 
                  className="text-xs font-bold text-[#e63946] hover:underline"
                >
                  {tCerca('viewAll') || "Vedi tutti"} →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fallbackRides.map((r, idx) => (
                  <PremiumRideCard
                    key={r.id}
                    ride={r as any}
                    index={idx}
                    today={todayStr}
                    formatDate={formatDate}
                    variant="grid"
                    t={(k) => tCerca(k)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  const [stops, reviews, similarRides, existingBooking] = await Promise.all([
    getRideStops(id),
    getDriverReviews(ride.driver_id, 3),
    getSimilarRides(ride, 3),
    getRideBookingForUser(id, user?.id),
  ]);

  return (
    <RideDetailClient
      ride={ride}
      user={user}
      reviews={reviews}
      similarRides={similarRides}
      stops={stops}
      existingBooking={existingBooking}
      rideId={id}
      locale={locale}
    />
  );
}
