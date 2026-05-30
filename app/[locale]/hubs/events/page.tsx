import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Calendar, MapPin, ArrowRight, Music, Users, Shield } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { GradientText } from "@/components/ui/premium/gradient-text";
import { OrbGlow } from "@/components/ui/premium/orb-glow";

export const metadata: Metadata = {
  title: "Hub Eventi | Andamus",
  description: "Trova passaggi per i concerti, festival e grandi eventi in Sardegna.",
};

interface SardiniaEvent {
  id: string;
  name: string;
  description: string;
  image_url: string;
  start_date: string;
  location: string;
  category: string;
  slug: string;
  ride_count?: number;
}

export default async function EventsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createServiceRoleClient();

  // 1. Fetch upcoming major events in Sardinia
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  const parsedEvents: SardiniaEvent[] = events || [];

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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] pb-20">
      {/* Hero Section with Premium Effects */}
      <div className="relative pt-12 pb-16 px-6 overflow-hidden">
        <OrbGlow className="-top-24 -right-24" color="#e63946" size={400} opacity={0.25} />
        <OrbGlow className="top-1/2 -left-20" color="#4285F4" size={300} opacity={0.15} />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#ffb3b1]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb3b1]">Community Hub</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6 leading-[0.9]">
            Grandi Eventi <br />
            <GradientText>Sardegna 2024</GradientText>
          </h1>
          
          <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Non viaggiare da solo. Unisciti ad altri fan, dividi le spese del viaggio e arriva a destinazione in sicurezza. Il carpooling perfetto per i tuoi eventi preferiti.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Prossime Date</h2>
          <div className="flex gap-2">
             <span className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-white/60">Tutti</span>
             <span className="px-3 py-1 rounded-lg hover:bg-white/5 text-[10px] font-bold text-white/30 transition-colors cursor-pointer">Concerti</span>
             <span className="px-3 py-1 rounded-lg hover:bg-white/5 text-[10px] font-bold text-white/30 transition-colors cursor-pointer">Festival</span>
          </div>
        </div>

        {parsedEvents.length === 0 ? (
          <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
            <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 font-medium">Nessun evento programmato al momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parsedEvents.map((event) => (
              <Link 
                key={event.id}
                href={`/${locale}/cerca?event=${event.slug}`}
                className="group relative flex flex-col rounded-3xl overflow-hidden bg-[#121212] border border-white/5 hover:border-[#e63946]/30 transition-all duration-500 shadow-2xl hover:shadow-[#e63946]/5"
                style={{ 
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.03)"
                }}
              >
                  {/* Event visual background card */}
                  <div className="relative aspect-[16/10] overflow-hidden w-full bg-neutral-900 border-b border-white/[0.04]">
                    <Image
                      src={event.image_url}
                      alt={event.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/30 to-transparent" />
                    
                    {/* Badge Indicator */}
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e63946]/90 backdrop-blur-md text-[9px] font-extrabold tracking-wide uppercase text-white shadow-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {event.ride_count && event.ride_count > 0 ? `${event.ride_count} Passaggi` : "Cerca Passaggio"}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#ffb3b1] mb-1 block">{event.category}</span>
                      <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-[#ffb3b1] transition-colors">{event.name}</h3>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2 text-white/60">
                          <Calendar className="w-4 h-4 text-[#e63946]" />
                          <span className="text-xs font-bold">{new Date(event.start_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                       </div>
                       <div className="flex items-center gap-2 text-white/60">
                          <MapPin className="w-4 h-4 text-[#e63946]" />
                          <span className="text-xs font-bold truncate">{event.location}</span>
                       </div>
                    </div>

                    <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between mt-auto">
                        <div className="flex -space-x-2">
                           {[1,2,3].map(i => (
                             <div key={i} className="w-6 h-6 rounded-full border-2 border-[#121212] bg-neutral-800 flex items-center justify-center">
                                <Users className="w-3 h-3 text-white/20" />
                             </div>
                           ))}
                           <div className="pl-4 text-[10px] font-bold text-white/30 flex items-center italic">
                              +12 altri
                           </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-[#e63946] group-hover:text-white group-hover:border-transparent transition-all">
                           <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                  </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Trust & Safety Banner */}
      <div className="max-w-6xl mx-auto px-6 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 rounded-[32px] bg-white/[0.02] border border-white/5 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#e63946]/5 blur-[80px] rounded-full -mr-20 -mt-20" />
          
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#4CAF50]/10 flex items-center justify-center text-[#4CAF50] mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-2">Viaggia Sicuro</h4>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">Profili verificati e feedback della community per ogni autista e passeggero.</p>
          </div>

          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#2196F3]/10 flex items-center justify-center text-[#2196F3] mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-2">Community Reale</h4>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">Incontra persone con i tuoi stessi interessi e vivi l&apos;evento già dal viaggio.</p>
          </div>

          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#FFC107]/10 flex items-center justify-center text-[#FFC107] mb-4">
              <Music className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-2">Risparmio Equo</h4>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">Metti a disposizione i posti vuoti in auto o prenota il tuo passaggio a prezzi equi, dividendo pedaggi e carburante.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
