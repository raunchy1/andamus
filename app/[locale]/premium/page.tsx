"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ProductAnalytics } from "@/lib/posthog";

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
  const locale = useLocale();
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
      ProductAnalytics.premiumCheckoutStarted(planId);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, locale }),
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link 
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-muted hover:text-fg mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            {tc("back")}
          </Link>
          
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-accent-dim border border-line flex items-center justify-center">
              <Crown className="h-8 w-8 text-accent" strokeWidth={1.5} />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-fg mb-4 heading-editorial">
            {t("choosePlan")}
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>

          {currentPlan !== "free" && (
            <div className="mt-6">
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-fg hover:bg-surface-2 transition-colors disabled:opacity-50"
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
              className={`relative rounded-2xl p-6 bg-surface border ${
                plan.popular ? "border-accent" : "border-line"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-fg text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" strokeWidth={1.5} />
                    {t("mostPopular")}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-fg heading-editorial">{plan.name}</h3>
                <p className="text-sm text-muted">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold font-mono text-fg">
                  {plan.price === 0 ? t("freeName") : `€${plan.price}`}
                </span>
                <span className="text-muted font-mono text-sm ml-1">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 flex-shrink-0 text-accent" strokeWidth={1.5} />
                    <span className="text-sm text-dim">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={currentPlan === plan.id}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                  currentPlan === plan.id
                    ? "bg-surface-2 text-muted cursor-not-allowed border border-line"
                    : plan.popular
                    ? "bg-accent text-accent-fg hover:opacity-90"
                    : "border border-line bg-surface-2 text-fg hover:border-accent hover:text-accent"
                }`}
              >
                {currentPlan === plan.id ? t("currentPlan") : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-muted">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm">{t("securePayments")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm">{t("instantActivation")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm">{t("cancelAnytime")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
