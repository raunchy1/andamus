"use client";

import { useState, useEffect, useRef } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Search, MapPin, Calendar, Car, MessageCircle, Shield, Plus, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Stats counter with Intersection Observer
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const end = value;
          const duration = 2000;
          const increment = end / (duration / 16);
          
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// FAQ Accordion Item
function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string; 
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className={`text-lg transition-all duration-200 ${isOpen ? 'font-semibold text-[#0f0f0f] dark:text-white' : 'font-normal text-[#333] dark:text-[#ccc]'}`}>
          {question}
        </span>
        <span className="ml-4 flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#666] dark:text-[#999]">
          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </span>
      </button>
      <div 
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: isOpen ? '200px' : '0', opacity: isOpen ? 1 : 0 }}
      >
        <p className="pb-6 text-[#666] dark:text-[#999] leading-relaxed">
          {answer}
        </p>
      </div>
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes draw-line {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-draw-line {
          animation: draw-line 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [totalRides, setTotalRides] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const supabase = createClient();

  const sardinianCities = [
    "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì",
    "Lanusei", "Iglesias", "Carbonia", "Alghero", "Tempio Pausania",
    "La Maddalena", "Siniscola", "Dorgali", "Muravera"
  ];

  useEffect(() => {
    const fetchStats = async () => {
      const { count } = await supabase.from("rides").select("*", { count: "exact", head: true });
      setTotalRides(count || 0);
    };
    fetchStats();
  }, [supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("to", destination);
    if (date) params.set("date", date);
    router.push(`/cerca?${params.toString()}`);
  };

  const recentRoutes = [
    { from: "Tortolì", to: "Cagliari" },
    { from: "Nuoro", to: "Sassari" },
    { from: "Olbia", to: "Cagliari" }
  ];

  const faqs = [
    {
      q: "È davvero gratuito?",
      a: "Sì, Andamus è completamente gratuito. Nessun abbonamento, nessuna commissione nascosta. I guidatori scelgono se chiedere un contributo benzina o offrire il passaggio gratis."
    },
    {
      q: "Come so che l'autista è affidabile?",
      a: "Ogni profilo mostra recensioni verificate, badge guadagnati e corse completate. Puoi vedere il rating prima di prenotare. Usiamo anche un sistema di verifica identità opzionale."
    },
    {
      q: "Devo registrarmi per cercare?",
      a: "Puoi sfogliare le corse disponibili senza registrarti. Per prenotare o pubblicare un passaggio serve un account — la registrazione è gratuita e richiede solo un clic con Google."
    },
    {
      q: "Posso offrire un passaggio gratis?",
      a: "Assolutamente. Molti guidatori offrono passaggi gratuiti a chi fa la loro stessa strada. Sei tu a decidere se e quanto chiedere per la benzina."
    },
    {
      q: "Cosa succede se il guidatore non si presenta?",
      a: "Puoi segnalare l'utente direttamente dall'app. Gli utenti con segnalazioni vengono esaminati dal nostro team. Consigliamo sempre di confermare via chat prima di partire."
    },
    {
      q: "In quali città funziona?",
      a: "Andamus copre tutta la Sardegna: Cagliari, Sassari, Olbia, Nuoro, Oristano, Ogliastra e tutti i paesi intermediari. Se la tua zona non è coperta, scrivici — stiamo espandendo."
    }
  ];

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-[#0f0f0f] dark:text-white font-sans">
      {/* SECTION 1 — HERO (asymmetric split) */}
      <section className="min-h-screen flex flex-col lg:flex-row">
        {/* LEFT: Content (60%) */}
        <div className="flex-1 lg:flex-[1.4] flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16 lg:py-0">
          {/* Label */}
          <div className="mb-6">
            <span className="text-sm text-[#e63946] font-medium tracking-wide uppercase">
              Carpooling · Sardegna · Gratuito
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#0f0f0f] dark:text-white mb-6">
            Il modo più semplice<br />
            di spostarsi in Sardegna.
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-[#666] dark:text-[#999] max-w-[480px] mb-8 leading-relaxed">
            Trova chi va nella tua stessa direzione.<br />
            Gratis, ogni giorno, in tutta l&apos;isola.
          </p>

          {/* Search Bar - clean card */}
          <form onSubmit={handleSearch} className="bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-2xl p-4 max-w-[560px] mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {/* Origin */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full h-12 pl-9 pr-3 bg-[#f5f5f0] dark:bg-[#0f0f0f] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-full text-sm text-[#0f0f0f] dark:text-white outline-none focus:border-[#e63946] appearance-none cursor-pointer"
                >
                  <option value="">Da dove parti?</option>
                  {sardinianCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Destination */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-12 pl-9 pr-3 bg-[#f5f5f0] dark:bg-[#0f0f0f] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-full text-sm text-[#0f0f0f] dark:text-white outline-none focus:border-[#e63946] appearance-none cursor-pointer"
                >
                  <option value="">Dove vai?</option>
                  {sardinianCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Date + Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-12 pl-9 pr-2 bg-[#f5f5f0] dark:bg-[#0f0f0f] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-full text-sm text-[#0f0f0f] dark:text-white outline-none focus:border-[#e63946]"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full h-12 bg-[#e63946] hover:bg-[#c92a37] text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" />
              Cerca
            </button>
          </form>

          {/* Recent searches */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#999] mr-2">Cercato di recente:</span>
            {recentRoutes.map((route) => (
              <Link
                key={`${route.from}-${route.to}`}
                href={`/cerca?from=${route.from}&to=${route.to}`}
                className="px-3 py-1.5 bg-[#f5f5f0] dark:bg-[#1a1a1a] rounded-full text-[#333] dark:text-[#ccc] hover:bg-[#e5e5e5] dark:hover:bg-[#2a2a2a] transition-colors text-xs"
              >
                {route.from} → {route.to}
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT: iPhone Mockup (40%) */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative">
          {/* Phone Frame */}
          <div className="relative w-[280px] h-[560px] bg-[#0f0f0f] rounded-[40px] p-2 shadow-2xl">
            {/* Screen */}
            <div className="w-full h-full bg-white dark:bg-[#0f0f0f] rounded-[32px] overflow-hidden relative">
              {/* App UI */}
              <div className="h-full flex flex-col">
                {/* Status bar */}
                <div className="h-6 bg-[#f5f5f0] dark:bg-[#1a1a1a]" />
                
                {/* App header */}
                <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#e63946] rounded-lg flex items-center justify-center">
                      <Car className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-[#0f0f0f] dark:text-white">Andamus</span>
                  </div>
                </div>

                {/* Ride cards */}
                <div className="p-3 space-y-3">
                  {/* Card 1 */}
                  <div className="p-3 border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#0f0f0f] dark:text-white">Tortolì → Cagliari</p>
                        <p className="text-xs text-[#999]">Oggi, 14:30</p>
                      </div>
                      <span className="text-sm font-bold text-[#e63946]">Gratis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#e5e5e5] rounded-full" />
                      <span className="text-xs text-[#666]">Marco</span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-3 border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#0f0f0f] dark:text-white">Nuoro → Sassari</p>
                        <p className="text-xs text-[#999]">Domani, 08:00</p>
                      </div>
                      <span className="text-sm font-bold text-[#0f0f0f] dark:text-white">15€</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#e5e5e5] rounded-full" />
                      <span className="text-xs text-[#666]">Anna</span>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="mt-auto border-t border-[#e5e5e5] dark:border-[#2a2a2a] p-3">
                  <div className="flex justify-around">
                    <div className="w-6 h-6 rounded-full bg-[#e63946]" />
                    <div className="w-6 h-6 rounded-full bg-[#e5e5e5]" />
                    <div className="w-6 h-6 rounded-full bg-[#e5e5e5]" />
                    <div className="w-6 h-6 rounded-full bg-[#e5e5e5]" />
                  </div>
                </div>
              </div>

              {/* Reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0f0f0f] rounded-full" />
          </div>

          {/* Floating badge */}
          <div className="absolute top-1/4 right-8 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚗</span>
              <div>
                <p className="text-lg font-bold text-[#e63946]">{totalRides}</p>
                <p className="text-xs text-[#999]">corse oggi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — STATS BAR (thin, clean) */}
      <section className="border-y border-[#e5e5e5] dark:border-[#2a2a2a] py-6">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-3 divide-x divide-[#e5e5e5] dark:divide-[#2a2a2a]">
            <div className="text-center px-4">
              <p className="text-2xl sm:text-3xl font-bold text-[#0f0f0f] dark:text-white mb-1">
                <AnimatedNumber value={2400} suffix="+" />
              </p>
              <p className="text-sm text-[#999]">sardi registrati</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl sm:text-3xl font-bold text-[#0f0f0f] dark:text-white mb-1">
                <AnimatedNumber value={1800} suffix="+" />
              </p>
              <p className="text-sm text-[#999]">passaggi completati</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl sm:text-3xl font-bold text-[#0f0f0f] dark:text-white mb-1">
                <AnimatedNumber value={48} />
              </p>
              <p className="text-sm text-[#999]">città collegate</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — COME FUNZIONA (alternating rows) */}
      <section className="py-20 sm:py-24 px-6 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f0f0f] dark:text-white mb-16 text-center">
            Come funziona
          </h2>

          {/* Row 1 - Text left, visual right */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20 pb-20 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
            <div>
              <span className="text-6xl font-bold text-[#e5e5e5] dark:text-[#2a2a2a]">01</span>
              <h3 className="text-2xl font-bold text-[#0f0f0f] dark:text-white mt-2 mb-4">
                Cerca il tuo percorso
              </h3>
              <p className="text-[#666] dark:text-[#999] leading-relaxed text-lg">
                Inserisci partenza e destinazione. In pochi secondi vedi tutti i passaggi disponibili sulla tua rotta.
              </p>
            </div>
            <div className="bg-[#0f0f0f] rounded-2xl p-6 sm:p-8">
              {/* Search illustration */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                  <MapPin className="w-5 h-5 text-[#e63946]" />
                  <span className="text-white text-sm">Cagliari</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                  <MapPin className="w-5 h-5 text-[#e63946]" />
                  <span className="text-white text-sm">Sassari</span>
                </div>
                <div className="pt-3 space-y-2">
                  <div className="p-3 border border-[#333] rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">Oggi, 15:00</span>
                      <span className="text-[#e63946]">Gratis</span>
                    </div>
                  </div>
                  <div className="p-3 border border-[#333] rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">Domani, 09:30</span>
                      <span className="text-white">12€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 - Visual left, text right */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20 pb-20 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
            <div className="order-2 lg:order-1 bg-[#f5f5f0] dark:bg-[#1a1a1a] rounded-2xl p-6 sm:p-8">
              {/* Chat illustration */}
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-[#e63946] text-white px-4 py-2 rounded-2xl rounded-br-md text-sm max-w-[200px]">
                    Ciao! A che ora passi da Tortolì?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#2a2a2a] text-[#0f0f0f] dark:text-white px-4 py-2 rounded-2xl rounded-bl-md text-sm max-w-[200px]">
                    Ciao! Verso le 14:30. Ti va bene?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#e63946] text-white px-4 py-2 rounded-2xl rounded-br-md text-sm max-w-[200px]">
                    Perfetto, ci vediamo allora!
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-6xl font-bold text-[#e5e5e5] dark:text-[#2a2a2a]">02</span>
              <h3 className="text-2xl font-bold text-[#0f0f0f] dark:text-white mt-2 mb-4">
                Scriviti con il guidatore
              </h3>
              <p className="text-[#666] dark:text-[#999] leading-relaxed text-lg">
                Contatta direttamente chi offre il passaggio. Niente WhatsApp, niente gruppi. Tutto in app, in sicurezza.
              </p>
            </div>
          </div>

          {/* Row 3 - Text left, visual right */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-6xl font-bold text-[#e5e5e5] dark:text-[#2a2a2a]">03</span>
              <h3 className="text-2xl font-bold text-[#0f0f0f] dark:text-white mt-2 mb-4">
                Parti insieme
              </h3>
              <p className="text-[#666] dark:text-[#999] leading-relaxed text-lg">
                Condividi il viaggio, dividi i costi della benzina se vuoi, e conosci qualcuno nuovo lungo la strada.
              </p>
            </div>
            <div className="bg-[#f5f5f0] dark:bg-[#1a1a1a] rounded-2xl p-6 sm:p-8 flex items-center justify-center">
              {/* Car + people illustration */}
              <div className="relative">
                <Car className="w-24 h-24 text-[#0f0f0f] dark:text-white" />
                <div className="absolute -bottom-2 -left-2 flex -space-x-2">
                  <div className="w-8 h-8 bg-[#e63946] rounded-full border-2 border-white dark:border-[#0f0f0f]" />
                  <div className="w-8 h-8 bg-[#333] rounded-full border-2 border-white dark:border-[#0f0f0f]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — MAPPA SARDEGNA (always dark) */}
      <section className="bg-[#0f0f0f] py-24 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
            Colleghi tutta la Sardegna
          </h2>
          <p className="text-[#999] text-center mb-12 text-lg">
            Da nord a sud, da est a ovest.
          </p>

          {/* Real SVG Map of Sardinia - Geographic Coordinates */}
          <div className="relative mx-auto max-w-[450px] mb-8">
            <svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              {/* Accurate Sardinia coastline from real geographic data */}
              <path
                d="M 56,37 L 93,47 Q 93,47 130,58 Q 130,58 186,52 Q 186,52 242,47 Q 242,47 298,52 Q 298,52 335,62 Q 335,62 353,71 Q 353,71 363,108 Q 363,108 359,155 Q 359,155 353,193 Q 353,193 348,221 Q 348,221 344,249 Q 344,249 340,277 Q 340,277 335,305 Q 335,305 326,352 Q 326,352 307,398 Q 307,398 288,436 Q 288,436 260,455 Q 260,455 214,473 Q 214,473 167,483 Q 167,483 121,473 Q 121,473 93,455 Q 93,455 65,417 Q 65,417 47,361 Q 47,361 37,305 Q 37,305 43,249 Q 43,249 56,193 Q 56,193 65,137 Q 65,137 61,90 Q 61,90 56,52 Q 56,52 56,37 Z"
                fill="#1a1a1a"
                stroke="#333"
                strokeWidth="1.5"
              />
              
              {/* City dots at real geographic coordinates */}
              {/* Cagliari: lon 9.1217, lat 39.2238 */}
              <circle cx="237" cy="413" r="5" fill="white" />
              <text x="245" y="417" fill="white" fontSize="11" fontWeight="500">Cagliari</text>
              
              {/* Sassari: lon 8.5556, lat 40.7259 */}
              <circle cx="131" cy="132" r="5" fill="white" />
              <text x="71" y="136" fill="white" fontSize="11" fontWeight="500">Sassari</text>
              
              {/* Olbia: lon 9.4992, lat 40.9234 */}
              <circle cx="307" cy="95" r="5" fill="white" />
              <text x="315" y="99" fill="white" fontSize="11" fontWeight="500">Olbia</text>
              
              {/* Nuoro: lon 9.3310, lat 40.3217 */}
              <circle cx="276" cy="207" r="5" fill="white" />
              <text x="284" y="199" fill="white" fontSize="11" fontWeight="500">Nuoro</text>
              
              {/* Oristano: lon 8.5916, lat 39.9036 */}
              <circle cx="138" cy="286" r="5" fill="white" />
              <text x="73" y="290" fill="white" fontSize="11" fontWeight="500">Oristano</text>
              
              {/* Tortolì: lon 9.6580, lat 39.9281 */}
              <circle cx="336" cy="281" r="5" fill="white" />
              <text x="344" y="285" fill="white" fontSize="11" fontWeight="500">Tortolì</text>

              {/* Animated route lines between cities */}
              {/* Cagliari-Nuoro */}
              <line x1="237" y1="413" x2="276" y2="207" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
                strokeDasharray="210" strokeDashoffset="210" className="animate-draw-line" />
              {/* Cagliari-Sassari */}
              <line x1="237" y1="413" x2="131" y2="132" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
                strokeDasharray="300" strokeDashoffset="300" className="animate-draw-line" style={{ animationDelay: '0.5s' }} />
              {/* Nuoro-Sassari */}
              <line x1="276" y1="207" x2="131" y2="132" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
                strokeDasharray="163" strokeDashoffset="163" className="animate-draw-line" style={{ animationDelay: '1s' }} />
              {/* Nuoro-Olbia */}
              <line x1="276" y1="207" x2="307" y2="95" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
                strokeDasharray="116" strokeDashoffset="116" className="animate-draw-line" style={{ animationDelay: '1.5s' }} />
              {/* Tortolì-Cagliari */}
              <line x1="336" y1="281" x2="237" y2="413" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
                strokeDasharray="165" strokeDashoffset="165" className="animate-draw-line" style={{ animationDelay: '2s' }} />
              {/* Tortolì-Nuoro */}
              <line x1="336" y1="281" x2="276" y2="207" stroke="#e63946" strokeWidth="2" strokeOpacity="0.8" 
                strokeDasharray="95" strokeDashoffset="95" className="animate-draw-line" style={{ animationDelay: '2.5s' }} />
            </svg>
          </div>

          {/* Distance chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { route: "Tortolì → Cagliari", dist: "150 km", time: "~2h" },
              { route: "Nuoro → Sassari", dist: "130 km", time: "~1h30" },
              { route: "Olbia → Cagliari", dist: "270 km", time: "~3h" }
            ].map((item) => (
              <div key={item.route} className="px-4 py-2 bg-[#1a1a1a] rounded-full text-sm">
                <span className="text-white">{item.route}</span>
                <span className="text-[#666] mx-2">·</span>
                <span className="text-[#999]">{item.dist}</span>
                <span className="text-[#666] mx-2">·</span>
                <span className="text-[#e63946]">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — APP DOWNLOAD */}
      <section className="bg-[#f5f5f0] dark:bg-[#0f0f0f] py-20 px-6 sm:px-12 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-sm text-[#e63946] font-medium uppercase tracking-wide mb-4">
            Mobile App
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f0f0f] dark:text-white mb-4">
            Presto su iOS e Android
          </h2>
          <p className="text-[#666] dark:text-[#999] mb-8 text-lg">
            Nel frattempo, Andamus funziona perfettamente dal browser del tuo telefono.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <button disabled className="px-6 py-3 bg-[#0f0f0f] text-white rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2">
              <span>🍎</span> App Store
              <span className="text-xs text-[#999]">Coming Soon</span>
            </button>
            <button disabled className="px-6 py-3 bg-[#0f0f0f] text-white rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2">
              <span>▶</span> Google Play
              <span className="text-xs text-[#999]">Coming Soon</span>
            </button>
          </div>
          <p className="text-sm text-[#999]">
            Aggiungi alla schermata home per un&apos;esperienza app nativa →
          </p>
        </div>
      </section>

      {/* SECTION 6 — FAQ ACCORDION */}
      <section className="py-20 px-6 sm:px-12">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-3xl font-bold text-[#0f0f0f] dark:text-white mb-12 text-center">
            Domande frequenti
          </h2>
          <div>
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — FINAL CTA (dark) */}
      <section className="bg-[#0f0f0f] py-24 px-6 sm:px-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Pronto a viaggiare?
          </h2>
          <p className="text-[#999] text-lg mb-10">
            Unisciti a migliaia di sardi che viaggiano insieme ogni giorno.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              href="/cerca"
              className="px-8 py-4 bg-[#e63946] hover:bg-[#c92a37] text-white font-semibold rounded-full inline-flex items-center gap-2 transition-colors"
            >
              Cerca un passaggio
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/offri"
              className="px-8 py-4 border border-white text-white hover:bg-white hover:text-[#0f0f0f] font-semibold rounded-full transition-colors"
            >
              Offri un passaggio
            </Link>
          </div>
          <p className="text-sm text-[#666]">
            Gratuito · Nessuna carta richiesta · Funziona subito
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e5e5e5] dark:border-[#2a2a2a] py-16 px-6 sm:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#e63946] rounded-lg flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[#0f0f0f] dark:text-white">Andamus</span>
              </div>
              <p className="text-sm text-[#999] mb-4">Il carpooling dei sardi.</p>
              <p className="text-xs text-[#999]">© {new Date().getFullYear()} Andamus</p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-semibold text-[#0f0f0f] dark:text-white mb-4">Prodotto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/cerca" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Cerca</Link></li>
                <li><Link href="/offri" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Offri</Link></li>
                <li><Link href="/" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Come funziona</Link></li>
                <li><Link href="/" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-semibold text-[#0f0f0f] dark:text-white mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Accedi</Link></li>
                <li><Link href="/" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Registrati</Link></li>
                <li><Link href="/profilo" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Profilo</Link></li>
                <li><Link href="/" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Sicurezza</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-semibold text-[#0f0f0f] dark:text-white mb-4">Contatti</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:info@andamus.it" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Email</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="text-[#666] hover:text-[#0f0f0f] dark:hover:text-white transition-colors">Facebook</a></li>
              </ul>
              <p className="text-xs text-[#e63946] mt-4">Fatto con ❤️ in Sardegna</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
