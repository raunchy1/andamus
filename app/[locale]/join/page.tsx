"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { Gift, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

function JoinContent() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [referralApplied, setReferralApplied] = useState(false);

  const applyReferralBonus = useCallback(async (userId: string, code: string) => {
    try {
      const { data, error } = await supabase.rpc("apply_referral_bonus", {
        new_user_id: userId,
        referrer_code: code
      });

      if (error) throw error;

      if (data && data[0].success) {
        setReferralApplied(true);
        localStorage.removeItem("pending_referral_code");
        toast.success(t("referralBonusApplied"));
      }
    } catch {
      localStorage.removeItem("pending_referral_code");
    }
  }, [supabase, t]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        const storedRefCode = localStorage.getItem("pending_referral_code");
        if (storedRefCode && !referralApplied) {
          await applyReferralBonus(currentUser.id, storedRefCode);
        }

        // Redirect after login: new users → onboarding, existing → profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", currentUser.id)
          .single();

        if (profile) {
          router.push(`/${locale}/profilo`);
        } else {
          router.push(`/${locale}/lansare`);
        }
        return;
      } else {
        if (referralCode) {
          localStorage.setItem("pending_referral_code", referralCode);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [referralCode, referralApplied, supabase, applyReferralBonus, router, locale]);

  const handleLogin = async () => {
    if (referralCode) {
      localStorage.setItem("pending_referral_code", referralCode);
      document.cookie = `pending_referral_code=${encodeURIComponent(referralCode)}; path=/; max-age=3600`;
    }
    
    try {
      await signInWithGoogle();
    } catch {
      toast.error(t("loginError"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 pt-16 pb-16 md:pb-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-on-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-on-surface mb-2">
            {referralApplied ? t("welcome") : t("alreadyRegistered")}
          </h1>
          
          {referralApplied ? (
            <>
              <p className="text-on-surface-variant mb-6">
                {t("referralBonusText")}
              </p>
              <div className="flex items-center justify-center gap-2 text-green-400 mb-6">
                <CheckCircle className="w-5 h-5" />
                <span>{t("bonusApplied")}</span>
              </div>
            </>
          ) : (
            <p className="text-on-surface-variant mb-6">
              {t("alreadyRegisteredText")}
            </p>
          )}
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-on-primary transition-all hover:opacity-90"
          >
            {t("goHome")}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 pt-16 pb-16 md:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("backToHome")}
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-on-primary" />
          </div>
          
          <h1 className="text-3xl font-bold text-on-surface mb-2">
            {t("joinTitle")}
          </h1>
          
          {referralCode ? (
            <p className="text-on-surface-variant">
              {t("referralPrompt")}
            </p>
          ) : (
            <p className="text-on-surface-variant">
              {t("tagline")}
            </p>
          )}
        </div>

        <div className="bg-surface-container border border-outline/20 rounded-2xl p-6 mb-8">
          <h2 className="text-on-surface font-semibold mb-4">{t("benefitsTitle")}</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-on-surface-variant">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{t("benefit1")}</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface-variant">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{t("benefit2")}</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface-variant">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{t("benefit3")}</span>
            </li>
            {referralCode && (
              <li className="flex items-center gap-3 text-primary">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">{t("referralBonus")}</span>
              </li>
            )}
          </ul>
        </div>

        <Button
          onClick={handleLogin}
          className="w-full bg-primary hover:opacity-90 text-on-primary py-6 text-lg font-semibold rounded-xl"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t("signInGoogle")}
        </Button>

        <p className="text-center text-on-surface-variant text-sm mt-6">
          {t("termsNotice")}
        </p>
      </motion.div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[100dvh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <JoinContent />
    </Suspense>
  );
}
