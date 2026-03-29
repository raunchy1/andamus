"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  Trophy,
  Share2,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Facebook,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

interface ReferralStats {
  referral_code: string;
  referrals_count: number;
  referral_points_earned: number;
}

interface LeaderboardUser {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  referrals_count: number;
}

export default function InvitaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://andamus.app';

  useEffect(() => {
    const loadData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push("/");
        return;
      }
      
      setUser(currentUser);

      // Load profile with referral stats
      const { data: profileData } = await supabase
        .from("profiles")
        .select("referral_code, referrals_count, referral_points_earned")
        .eq("id", currentUser.id)
        .single();

      setProfile(profileData);

      // Load leaderboard
      const { data: leaderboardData } = await supabase
        .rpc("get_referral_leaderboard", { limit_count: 5 });

      setLeaderboard(leaderboardData || []);
      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  const referralLink = profile?.referral_code 
    ? `${appUrl}/join?ref=${profile.referral_code}`
    : "";

  const copyLink = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copiato!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Errore nella copia");
    }
  };

  const shareWhatsApp = () => {
    const message = `Unisciti ad Andamus, l'app gratuita di carpooling per la Sardegna! Usa il mio codice ${profile?.referral_code} e guadagna 25 punti bonus: ${referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    const message = `Unisciti ad Andamus, l'app gratuita di carpooling per la Sardegna! Usa il mio codice ${profile?.referral_code} e guadagna 25 punti bonus:`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] pt-20 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#e63946]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/profilo"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Torna al profilo
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#e63946] to-[#c92a37] mb-4">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Invita Amici</h1>
            <p className="text-white/60">Guadagnate entrambi 25 punti bonus!</p>
          </motion.div>
        </div>

        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#e63946]" />
            Il tuo link personale
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm break-all">
              {referralLink}
            </div>
            <Button
              onClick={copyLink}
              className="bg-[#e63946] hover:bg-[#c92a37] text-white"
            >
              {copied ? (
                <><Check className="w-4 h-4 mr-2" /> Copiato</>
              ) : (
                <><Copy className="w-4 h-4 mr-2" /> Copia link</>
              )}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-500/20 border border-green-500/30 py-3 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={shareTelegram}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-500/20 border border-blue-500/30 py-3 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Telegram</span>
            </button>
            <button
              onClick={shareFacebook}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 py-3 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span className="hidden sm:inline">Facebook</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{profile?.referrals_count || 0}</p>
            <p className="text-white/60 text-sm">Amici invitati</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-white">{profile?.referral_points_earned || 0}</p>
            <p className="text-white/60 text-sm">Punti guadagnati</p>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Come funziona</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center text-white font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <p className="text-white font-medium">Condividi il tuo link</p>
                <p className="text-white/60 text-sm">Invia il link ai tuoi amici via WhatsApp, Telegram o Facebook</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center text-white font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <p className="text-white font-medium">I tuoi amici si iscrivono</p>
                <p className="text-white/60 text-sm">Quando si registrano usando il tuo codice, ricevono 25 punti bonus</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center text-white font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <p className="text-white font-medium">Guadagnate entrambi!</p>
                <p className="text-white/60 text-sm">Ricevi 25 punti bonus per ogni amico che si registra</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Classifica del mese
          </h2>
          
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div 
                key={user.user_id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  index === 1 ? "bg-gray-400/20 text-gray-300" :
                  index === 2 ? "bg-orange-600/20 text-orange-400" :
                  "bg-white/10 text-white/60"
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  {user.user_avatar ? (
                    <img 
                      src={user.user_avatar} 
                      alt={user.user_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white/60" />
                    </div>
                  )}
                  <span className="text-white font-medium">{user.user_name || 'Utente'}</span>
                </div>
                
                <div className="text-right">
                  <p className="text-white font-bold">{user.referrals_count}</p>
                  <p className="text-white/60 text-xs">inviti</p>
                </div>
              </div>
            ))}
            
            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-white/40">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nessun invito questo mese</p>
                <p className="text-sm">Sii il primo!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
