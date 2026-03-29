"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import toast from "react-hot-toast";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    price: 0,
    period: "per sempre",
    description: "Perfetto per iniziare",
    features: [
      "Ricerca passaggi illimitata",
      "Pubblicazione fino a 3 corse/mese",
      "Chat di base",
      "Supporto email",
    ],
    cta: "Continua Gratis",
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 4.99,
    period: "/mese",
    description: "Per chi viaggia spesso",
    features: [
      "Tutto del piano Gratuito",
      "Corse illimitate",
      "Badge Premium esclusivo",
      "Priorità nelle ricerche",
      "Statistiche avanzate",
      "Supporto prioritario",
      "Nessuna pubblicità",
    ],
    cta: "Passa a Premium",
    popular: true,
  },
  {
    id: "driver",
    name: "Driver Pro",
    price: 9.99,
    period: "/mese",
    description: "Per i conducenti abituali",
    features: [
      "Tutto del piano Premium",
      "Corse illimitate",
      "Badge Driver Pro esclusivo",
      "Verifica prioritaria",
      "Strumenti per conducenti",
      "Report avanzati",
      "API access",
    ],
    cta: "Diventa Driver Pro",
    popular: false,
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("free");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      
      // Check current plan from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("id", currentUser.id)
        .single();
      
      if (profile?.subscription_plan) {
        setCurrentPlan(profile.subscription_plan);
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, [router, supabase]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Devi essere loggato per abbonarti");
      return;
    }
    
    if (planId === "free") {
      toast.success("Stai già usando il piano gratuito!");
      return;
    }
    
    // In a real app, this would redirect to Stripe or similar
    toast(`Piano ${planId} in arrivo presto!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#e63946] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link 
            href="/it"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna indietro
          </Link>
          
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Scegli il tuo piano
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Sblocca funzionalità esclusive e viaggia senza limiti con i nostri piani Premium
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "bg-gradient-to-b from-[#e63946] to-[#c92a37] text-white"
                  : "bg-white/5 text-white border border-white/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Più popolare
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm ${plan.popular ? "text-white/80" : "text-white/50"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? "Gratis" : `€${plan.price}`}
                </span>
                <span className={plan.popular ? "text-white/80" : "text-white/50"}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 ${
                      plan.popular ? "text-white" : "text-[#e63946]"
                    }`} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={currentPlan === plan.id}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                  currentPlan === plan.id
                    ? "bg-white/20 cursor-not-allowed"
                    : plan.popular
                    ? "bg-white text-[#e63946] hover:bg-white/90"
                    : "bg-[#e63946] text-white hover:bg-[#c92a37]"
                }`}
              >
                {currentPlan === plan.id ? "Piano attuale" : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Pagamenti sicuri</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm">Attivazione immediata</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span className="text-sm">Cancella quando vuoi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
