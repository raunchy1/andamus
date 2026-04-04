"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";
import { Gift, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function JoinPage() {

  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  const supabase = useMemo(() => createClient(), []);
  
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
        toast.success("Bonus di 25 punti applicato! 🎉");
      }
    } catch {
      // console.error("Error applying referral:", _error);
      localStorage.removeItem("pending_referral_code");
    }
  }, [supabase]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        // Check if we have a stored referral code to apply
        const storedRefCode = localStorage.getItem("pending_referral_code");
        if (storedRefCode && !referralApplied) {
          await applyReferralBonus(currentUser.id, storedRefCode);
        }
      } else {
        // Store referral code in localStorage if provided
        if (referralCode) {
          localStorage.setItem("pending_referral_code", referralCode);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [referralCode, referralApplied, supabase, applyReferralBonus]);



  const handleLogin = async () => {
    if (referralCode) {
      // Store in localStorage for client-side handling
      localStorage.setItem("pending_referral_code", referralCode);
      // Set cookie for server-side handling
      document.cookie = `pending_referral_code=${encodeURIComponent(referralCode)}; path=/; max-age=3600`;
    }
    
    try {
      await signInWithGoogle();
    } catch {
      toast.error("Errore durante l'accesso");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#e63946]" />
      </div>
    );
  }

  // User is already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#e63946] to-[#c92a37] flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            {referralApplied ? "Benvenuto!" : "Già registrato"}
          </h1>
          
          {referralApplied ? (
            <>
              <p className="text-white/60 mb-6">
                Hai ricevuto <span className="text-[#e63946] font-bold">25 punti bonus</span> per esserti registrato con un codice invito!
              </p>
              <div className="flex items-center justify-center gap-2 text-green-400 mb-6">
                <CheckCircle className="w-5 h-5" />
                <span>Bonus applicato con successo</span>
              </div>
            </>
          ) : (
            <p className="text-white/60 mb-6">
              Sei già registrato ad Andamus.
            </p>
          )}
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#c92a37]"
          >
            Vai alla home
          </Link>
        </motion.div>
      </div>
    );
  }

  // Show signup prompt with referral info
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Torna alla home
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#e63946] to-[#c92a37] flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Unisciti ad Andamus
          </h1>
          
          {referralCode ? (
            <p className="text-white/60">
              Registrati e ricevi <span className="text-[#e63946] font-bold">25 punti bonus</span>!
            </p>
          ) : (
            <p className="text-white/60">
              L&apos;app gratuita di carpooling per la Sardegna
            </p>
          )}
        </div>

        {/* Benefits */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-4">Cosa ottieni:</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-white/80">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Corsi gratuiti in tutta la Sardegna</span>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Sistema di rating e recensioni</span>
            </li>
            <li className="flex items-center gap-3 text-white/80">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Chat integrata con i passeggeri</span>
            </li>
            {referralCode && (
              <li className="flex items-center gap-3 text-[#e63946]">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">25 punti bonus subito!</span>
              </li>
            )}
          </ul>
        </div>

        {/* Login Button */}
        <Button
          onClick={handleLogin}
          className="w-full bg-[#e63946] hover:bg-[#c92a37] text-white py-6 text-lg font-semibold rounded-xl"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Accedi con Google
        </Button>

        <p className="text-center text-white/40 text-sm mt-6">
          Cliccando su &quot;Accedi con Google&quot; accetti i nostri Termini di Servizio e Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
