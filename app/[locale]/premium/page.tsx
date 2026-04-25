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
import { useTranslations } from "next-intl";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

function usePlans(t: ReturnType<typeof useTranslations>): Plan[] {
  return [
    {
      id: "free",
      name: t("freeName"),
      price: 0,
      period: t("freePeriod"),
      description: t("freeDescription"),
      features: [
        t("freeFeature1"),
        t("freeFeature2"),
        t("freeFeature3"),
        t("freeFeature4"),
      ],
      cta: t("freeCta"),
      popular: false,
    },
    {
      id: "premium",
      name: t("premiumName"),
      price: 4.99,
      period: t("premiumPeriod"),
      description: t("premiumDescription"),
      features: [
        t("premiumFeature1"),
        t("premiumFeature2"),
        t("premiumFeature3"),
        t("premiumFeature4"),
        t("premiumFeature5"),
        t("premiumFeature6"),
        t("premiumFeature7"),
      ],
      cta: t("premiumCta"),
      popular: true,
    },
    {
      id: "driver",
      name: t("driverName"),
      price: 9.99,
      period: t("driverPeriod"),
      description: t("driverDescription"),
      features: [
        t("driverFeature1"),
        t("driverFeature2"),
        t("driverFeature3"),
        t("driverFeature4"),
        t("driverFeature5"),
        t("driverFeature6"),
        t("driverFeature7"),
      ],
      cta: t("driverCta"),
      popular: false,
    },
  ];
}

export default function PremiumPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("premium");
  const tc = useTranslations("common");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("free");

  const plans = usePlans(t);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      
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
      toast.error(t("loginRequired"));
      return;
    }

    if (planId === "free") {
      toast.success(t("alreadyFree"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, locale: "it" }),
      });
      const data = await res.json();
      if (data.url) {
        void Promise.resolve().then(() => { window.location.href = data.url; });
      } else {
        toast.error(data.error || t("checkoutError"));
        setLoading(false);
      }
    } catch {
      toast.error(t("checkoutError"));
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || t("manageError"));
        setLoading(false);
      }
    } catch {
      toast.error(t("manageError"));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#e63946] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link 
            href="/it"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tc("back")}
          </Link>
          
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t("choosePlan")}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>

          {currentPlan !== "free" && (
            <div className="mt-6">
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {t("manageSubscription")}
              </button>
            </div>
          )}
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
                    {t("mostPopular")}
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
                  {plan.price === 0 ? t("freeName") : `€${plan.price}`}
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
                {currentPlan === plan.id ? t("currentPlan") : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">{t("securePayments")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm">{t("instantActivation")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span className="text-sm">{t("cancelAnytime")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
