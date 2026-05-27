import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Calendar, MapPin, ArrowRight, Music, Users, Shield } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { OrbGlow } from "@/components/ui/premium/orb-glow";

export const revalidate = 3600; // ISR cache revalidation every hour

export const metadata: Metadata = {
  title: "Eventi & Festival Carpooling Sardegna | Andamus",
  description: "Condividi il viaggio per i festival, concerti e sagre più importanti della Sardegna. Risparmia sulle spese, riduci le emissioni e viaggia in compagnia!",
};

type SardiniaEvent = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string | null;
  location: string;
  city: string;
  ride_count?: number;
};

export default async function EventsHubPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || "it";
  const supabase = createServiceRoleClient();

  // 1. Fetch all active/upcoming events in Sardinia
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  let parsedEvents: SardiniaEvent[] = events || [];

  if (error) {
    console.error("[events-hub] Error fetching events:", error.message);
  }

  // 2. Fetch associated ride counts for each event to show real-time marketplace signals
  if (parsedEvents.length > 0) {
    await Promise.all(
      parsedEvents.map(async (event) => {
        const { count } = await supabase
          .from("rides")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .eq("status", "active");
        
        event.ride_count = count || 0;
      })
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e5e2e1] overflow-x-hidden relative pb-16 pt-12">
      {/* Dynamic Aurora Ambient Orb */}
      <OrbGlow className="-top-40 -left-40" color="#e63946" size={500} opacity={0.25} />
      <OrbGlow className="bottom-20 -right-40" color="#f4a261" size={400} opacity={0.15} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Breadcrumbs & Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffb3b1]/30 bg-[#ffb3b1]/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#ffb3b1] backdrop-blur-md">
            <Music className="h-2.5 w-2.5" />
            Domination Hub
          </span>
        </div>

        {/* Header Block */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <h1 className="font-heading font-extrabold tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.92] uppercase">
            Sardegna <br />
            <GradientText>Eventi & Festival</GradientText>
          </h1>
          <p className="mt-4 text-white/60 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
            Viaggia in compagnia verso i concerti, i festival universitari e le feste tradizionali più amate della Sardegna. Condividi il passaggio, dimezza i costi del carburante ed evita lo stress del parcheggio.
          </p>
        </div>

        {/* Events Grid */}
        {parsedEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-12 text-center max-w-lg mx-auto">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg">Nessun evento in programma</h3>
            <p className="text-white/40 text-xs mt-2">Torna a trovarci presto per scoprire i prossimi grandi festival e concerti sardi!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {parsedEvents.map((event) => {
              const formattedDate = new Date(event.start_date).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={event.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#121212] hover:bg-[#151515] transition-all duration-300 flex flex-col justify-between"
                  style={{
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Event visual background card */}
                  <div className="relative aspect-[16/10] overflow-hidden w-full bg-neutral-900 border-b border-white/[0.04]">
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/30 to-transparent" />
                    
                    {/* Live Surge Indicator */}
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e63946]/90 backdrop-blur-md text-[9px] font-extrabold tracking-wide uppercase text-white shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      {event.ride_count || 0} Viaggi attivi
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2.5">
                        <span className="flex items-center gap-1 text-[#ffb3b1]">
                          <Calendar className="w-3.5 h-3.5" />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.city}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-[#ffb3b1] transition-colors leading-tight">
                        {event.name}
                      </h3>
                      
                      <p className="mt-2 text-white/50 text-xs leading-relaxed line-clamp-3">
                        {event.description || "Unisciti alla carovana e trova passeggeri o conducenti per andare a questo fantastico evento in Sardegna!"}
                      </p>
                    </div>

                    {/* CTAs */}
                    <div className="mt-6 pt-4 border-t border-white/[0.04] grid grid-cols-2 gap-3">
                      <Link
                        href={`/${locale}/cerca?from=&to=${encodeURIComponent(event.city)}&date=${event.start_date}`}
                        className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] transition-colors text-xs font-semibold text-white/90"
                      >
                        Trova
                      </Link>
                      <Link
                        href={`/${locale}/offri?to=${encodeURIComponent(event.city)}&date=${event.start_date}&eventId=${event.id}`}
                        className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-[#e63946]/10 hover:bg-[#e63946]/20 border border-[#e63946]/25 transition-colors text-xs font-bold text-[#e63946]"
                      >
                        Offri
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dominance Info Section */}
        <div className="mt-20 border-t border-white/5 pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-3xl p-6">
            <Shield className="w-6 h-6 text-[#ffb3b1] mb-3" />
            <h4 className="font-bold text-white text-base">Community Sicura</h4>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">Profili recensiti e verificati. Andamus garantisce massima trasparenza e rispetto delle regole di mobilità.</p>
          </div>
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-3xl p-6">
            <Users className="w-6 h-6 text-[#ffb3b1] mb-3" />
            <h4 className="font-bold text-white text-base">Incontro Intelligente</h4>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">Connettiti con altri studenti universitari o amanti dei festival per viaggiare insieme e fare nuove amicizie lungo la strada.</p>
          </div>
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-3xl p-6">
            <Sparkles className="w-6 h-6 text-[#ffb3b1] mb-3" />
            <h4 className="font-bold text-white text-base">Risparmio Garantito</h4>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">Metti a disposizione i posti vuoti in auto o prenota il tuo passaggio a prezzi equi, dividendo pedaggi e carburante.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
