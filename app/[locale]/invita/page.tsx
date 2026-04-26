"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
  const t = useTranslations("referrals");
  const router = useRouter();
  const supabase = createClient();
  const [, setUser] = useState<SupabaseUser | null>(null);
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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("referral_code, referrals_count, referral_points_earned")
        .eq("id", currentUser.id)
        .single();

      setProfile(profileData);

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
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyError"));
    }
  };

  const shareWhatsApp = () => {
    const message = t("shareMessage", { code: profile?.referral_code || "", link: referralLink });
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    const message = t("shareMessage", { code: profile?.referral_code || "", link: "" });
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-20 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#e63946]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/profilo"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("backToProfile")}
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#e63946] to-[#c92a37] mb-4">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
            <p className="text-white/60">{t("subtitle")}</p>
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
            {t("yourLink")}
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
                <><Check className="w-4 h-4 mr-2" /> {t("copied")}</>
              ) : (
                <><Copy className="w-4 h-4 mr-2" /> {t("copyLink")}</>
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
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
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
            <p className="text-white/60 text-sm">{t("friendsInvited")}</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-white">{profile?.referral_points_earned || 0}</p>
            <p className="text-white/60 text-sm">{t("pointsEarned")}</p>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">{t("howItWorks")}</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center text-white font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <p className="text-white font-medium">{t("step1Title")}</p>
                <p className="text-white/60 text-sm">{t("step1Desc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center text-white font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <p className="text-white font-medium">{t("step2Title")}</p>
                <p className="text-white/60 text-sm">{t("step2Desc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center text-white font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <p className="text-white font-medium">{t("step3Title")}</p>
                <p className="text-white/60 text-sm">{t("step3Desc")}</p>
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
            {t("leaderboard")}
          </h2>
          
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div 
                key={user.user_id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  index === 1 ? "bg-gray-400/20 text-on-surface-variant" :
                  index === 2 ? "bg-orange-600/20 text-orange-400" :
                  "bg-white/10 text-white/60"
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  {user.user_avatar ? (
                    <Image 
                      src={user.user_avatar} 
                      alt={user.user_name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white/60" />
                    </div>
                  )}
                  <span className="text-white font-medium">{user.user_name || t("userFallback")}</span>
                </div>
                
                <div className="text-right">
                  <p className="text-white font-bold">{user.referrals_count}</p>
                  <p className="text-white/60 text-xs">{t("invites")}</p>
                </div>
              </div>
            ))}
            
            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-white/40">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t("emptyTitle")}</p>
                <p className="text-sm">{t("emptySubtitle")}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
