import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { 
  Plane, 
  GraduationCap, 
  ChevronRight, 
  Calendar, 
  Car, 
  MapPin,
  Clock,
  Sparkles
} from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { OrbGlow } from "@/components/ui/premium/orb-glow";
import { RevealItem } from "@/components/ui/premium/reveal";

// Enable incremental static regeneration (ISR) - cache for 1 hour
export const revalidate = 3600;

interface HubData {
  id: string;
  name: string;
  type: "airport" | "university";
  city: string;
  coords: { lat: number; lng: number };
  description: string;
  icon: any;
  shortcuts: { label: string; from: string; to: string; qs?: string }[];
  accentColor: string;
}

export default async function HubsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cerca" });

  const supabase = createServiceRoleClient();

  const hubs: HubData[] = [
    {
      id: "cagliari-elmas",
      name: "Aeroporto Cagliari Elmas (CAG)",
      type: "airport",
      city: "Cagliari",
      coords: { lat: 39.2514, lng: 9.0641 },
      description: "Il principale snodo aereo del Sud Sardegna, collegato con tutta l'isola.",
      icon: Plane,
      accentColor: "from-sky-500 to-blue-600",
      shortcuts: [
        { label: "Partenze da CAG", from: "Cagliari Aeroporto", to: "Sassari" },
        { label: "Arrivi a CAG", from: "Sassari", to: "Cagliari Aeroporto" },
        { label: "Corridoio Oristano", from: "Oristano", to: "Cagliari Aeroporto" },
      ],
    },
    {
      id: "olbia-airport",
      name: "Aeroporto Olbia Costa Smeralda (OLB)",
      type: "airport",
      city: "Olbia",
      coords: { lat: 40.8986, lng: 9.5175 },
      description: "Lo scalo di riferimento per la Gallura e il Nord-Est, frequentato da turisti e lavoratori.",
      icon: Plane,
      accentColor: "from-teal-400 to-emerald-600",
      shortcuts: [
        { label: "Partenze da OLB", from: "Olbia Aeroporto", to: "Sassari" },
        { label: "Arrivi a OLB", from: "Cagliari", to: "Olbia Aeroporto" },
        { label: "Gallura Express", from: "Nuoro", to: "Olbia Aeroporto" },
      ],
    },
    {
      id: "unica-monserrato",
      name: "Cittadella Universitaria UniCa",
      type: "university",
      city: "Monserrato / Cagliari",
      coords: { lat: 39.2678, lng: 9.1417 },
      description: "Il cuore scientifico e studentesco dell'Università di Cagliari, polo ad altissima densità pendolare.",
      icon: GraduationCap,
      accentColor: "from-purple-500 to-indigo-600",
      shortcuts: [
        { label: "Studente Lunedì Mattina", from: "Oristano", to: "Cittadella Universitaria Monserrato" },
        { label: "Rientro Venerdì", from: "Cittadella Universitaria Monserrato", to: "Sassari" },
        { label: "Tratta Cagliari Centro", from: "Cagliari", to: "Cittadella Universitaria Monserrato" },
      ],
    },
    {
      id: "uniss-piazza-italia",
      name: "Università degli Studi di Sassari (UniSs)",
      type: "university",
      city: "Sassari",
      coords: { lat: 40.7244, lng: 8.5614 },
      description: "Il punto d'incontro degli studenti del Nord Sardegna, con flussi attivi da Alghero e Porto Torres.",
      icon: GraduationCap,
      accentColor: "from-orange-500 to-rose-600",
      shortcuts: [
        { label: "Venerdì Studenti", from: "Sassari", to: "Cagliari" },
        { label: "Pendolari Alghero", from: "Alghero", to: "Sassari" },
        { label: "Tratta Porto Torres", from: "Porto Torres", to: "Sassari" },
      ],
    },
  ];

  // Fetch active rides counts and upcoming departures for each hub
  const hubsWithRides = await Promise.all(
    hubs.map(async (hub) => {
      // Find rides heading to this hub's city or matching keywords in route details
      const { data: activeRides, error } = await supabase
        .from("rides")
        .select(`
          id,
          from_city,
          to_city,
          date,
          time,
          price,
          seats_available,
          profiles:driver_id (
            name,
            avatar_url
          )
        `)
        .eq("status", "active")
        .or(`from_city.ilike.%${hub.city}%,to_city.ilike.%${hub.city}%`)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(3);

      return {
        ...hub,
        upcomingRides: activeRides || [],
        totalActiveCount: activeRides?.length || 0,
      };
    })
  );

  return (
    <div className="relative min-h-screen bg-[#0b0b0f] text-white pt-24 pb-16 px-4 overflow-hidden">
      {/* Decorative Orbs */}
      <OrbGlow color="#e63946" className="top-12 left-1/4 w-[400px] h-[400px] opacity-15" />
      <OrbGlow color="#f4a261" className="bottom-12 right-1/4 w-[500px] h-[500px] opacity-10" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header section */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e63946]/30 bg-[#e63946]/10 text-[#f4a261] text-xs font-semibold backdrop-blur-md shadow-lg shadow-[#e63946]/5">
            <Sparkles className="w-3.5 h-3.5" />
            Nodi di Viaggio Popolari
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
            Andamus Presets Hubs
          </h1>
          <p className="text-white/60 font-body-lg">
            Rotte ad alta densità per studenti universitari e viaggiatori aeroportuali in tutta la Sardegna.
          </p>
        </div>

        {/* Hubs Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {hubsWithRides.map((hub, idx) => {
            const Icon = hub.icon;
            return (
              <div
                key={hub.id}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md shadow-2xl transition duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                {/* Visual gradient backdrop overlay */}
                <div className={`absolute top-0 right-0 w-[150px] h-[150px] bg-gradient-to-br ${hub.accentColor} opacity-5 blur-3xl group-hover:opacity-10 transition duration-500`} />

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Top Header */}
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${hub.accentColor} text-white shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4a261]">
                        {hub.type === "airport" ? "Hub Aeroportuale" : "Snodo Universitario"}
                      </div>
                      <h3 className="text-xl font-heading font-bold text-white group-hover:text-[#f4a261] transition">
                        {hub.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-white/50 leading-relaxed font-body-sm">
                    {hub.description}
                  </p>

                  {/* Predefined Quick Search Shortcuts */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/30">
                      Rotte Rapide ad Alta Frequenza
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hub.shortcuts.map((shortcut, sIdx) => (
                        <Link
                          key={sIdx}
                          href={`/${locale}/cerca?from=${encodeURIComponent(shortcut.from)}&to=${encodeURIComponent(shortcut.to)}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/[0.04] bg-white/[0.03] text-xs text-white/80 hover:bg-white/[0.08] hover:border-white/[0.1] hover:text-[#f4a261] transition"
                        >
                          {shortcut.label}
                          <ChevronRight className="w-3 h-3 text-[#f4a261]/80" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Active Departures list */}
                  <div className="pt-4 border-t border-white/[0.04] space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold uppercase tracking-widest text-white/30">
                        Prossime Partenze Attive
                      </div>
                      <span className="text-[10px] font-bold bg-[#e63946]/10 text-[#f4a261] px-2 py-0.5 rounded-full border border-[#e63946]/20">
                        {hub.totalActiveCount} passaggi attivi
                      </span>
                    </div>

                    {hub.upcomingRides.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {hub.upcomingRides.map((ride: any) => (
                          <Link
                            key={ride.id}
                            href={`/${locale}/corsa/${ride.id}`}
                            className="flex items-center justify-between p-3 rounded-2xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.05] transition text-xs text-white"
                          >
                            <div className="flex items-center gap-3">
                              {ride.profiles?.avatar_url ? (
                                <img src={ride.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full border border-white/[0.08] object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-white/[0.06] text-white/50 flex items-center justify-center font-bold">
                                  {ride.profiles?.name?.[0] || "?"}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white/90 truncate max-w-[150px]">
                                  {ride.from_city} ➔ {ride.to_city}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(ride.date).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", { day: "numeric", month: "short" })}</span>
                                  <Clock className="w-3 h-3 ml-1" />
                                  <span>{ride.time.slice(0, 5)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-[#f4a261]">€{ride.price}</span>
                              <div className="text-[9px] text-white/40">Posti: {ride.seats_available}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-white/[0.04] bg-white/[0.01] text-xs text-white/40">
                        Nessuna partenza diretta registrata per le prossime ore.
                        <Link href={`/${locale}/offri?from=${encodeURIComponent(hub.city)}`} className="block mt-2 font-semibold text-[#f4a261] hover:underline">
                          Pubblica il primo tragitto!
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
