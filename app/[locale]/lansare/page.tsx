"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  Car, 
  Search, 
  User, 
  Bell, 
  Share2, 
  Shield, 
  Star,
  ChevronRight,
  Rocket
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ShareApp } from "@/components/ShareApp";

export default function LaunchPage() {
  const locale = useLocale();
  const t = useTranslations("onboarding");
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const CHECKLIST_ITEMS = [
    {
      id: "profile",
      icon: User,
      title: t("checklist.completeProfile"),
      description: t("checklist.completeProfileDesc"),
      action: { href: "/profilo", label: t("checklist.go") },
    },
    {
      id: "search",
      icon: Search,
      title: t("checklist.firstRide"),
      description: t("checklist.firstRideDesc"),
      action: { href: "/cerca", label: t("checklist.search") },
    },
    {
      id: "offer",
      icon: Car,
      title: t("checklist.offerRide"),
      description: t("checklist.offerRideDesc"),
      action: { href: "/offri", label: t("checklist.publish") },
    },
    {
      id: "notifications",
      icon: Bell,
      title: t("checklist.enableNotifications"),
      description: t("checklist.enableNotificationsDesc"),
      action: { href: "/profilo", label: t("checklist.settings") },
    },
    {
      id: "share",
      icon: Share2,
      title: t("checklist.inviteFriends"),
      description: t("checklist.inviteFriendsDesc"),
      isShare: true,
    },
    {
      id: "safety",
      icon: Shield,
      title: t("checklist.discoverSafety"),
      description: t("checklist.discoverSafetyDesc"),
      action: { href: "/profilo", label: t("checklist.safetyInfo") },
    },
  ];

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      const saved = localStorage.getItem("andamus_launch_checklist");
      if (saved) {
        setCompletedItems(JSON.parse(saved));
      }
    });
  }, []);

  const toggleItem = (id: string) => {
    const newCompleted = completedItems.includes(id)
      ? completedItems.filter((item) => item !== id)
      : [...completedItems, id];
    setCompletedItems(newCompleted);
    localStorage.setItem("andamus_launch_checklist", JSON.stringify(newCompleted));
  };

  const progress = Math.round((completedItems.length / CHECKLIST_ITEMS.length) * 100);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-pulse text-primary">
          <Rocket className="w-12 h-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#2D6A4F] mb-6"
          >
            <Rocket className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight mb-4"
          >
            {t("welcome")}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-fg max-w-lg mx-auto"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* Progress */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-fg">{t("progress")}</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-full bg-gradient-to-r from-primary to-[#2D6A4F] rounded-full"
            />
          </div>
        </motion.div>

        {/* Checklist */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {CHECKLIST_ITEMS.map((item, index) => {
            const isCompleted = completedItems.includes(item.id);
            const Icon = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`relative p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? "bg-surface-2/50 border-primary/30"
                    : "bg-surface-2 border-line-strong hover:border-faint"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-primary border-primary"
                        : "border-[#e5e2e1]/30 hover:border-primary"
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </button>

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted ? "bg-primary/20" : "bg-bg"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isCompleted ? "text-primary" : "text-fg"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold mb-1 ${
                        isCompleted ? "text-muted line-through" : "text-ink"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`text-sm ${
                        isCompleted ? "text-faint" : "text-muted"
                      }`}
                    >
                      {item.description}
                    </p>

                    {/* Action */}
                    {!isCompleted && (
                      <div className="mt-3">
                        {item.isShare ? (
                          <ShareApp variant="outline" className="text-primary border-primary/50" />
                        ) : item.action ? (
                          <Link
                            href={`/${locale}${item.action.href}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary transition-colors"
                          >
                            {item.action.label}
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion badge */}
                {isCompleted && (
                  <div className="absolute top-4 right-4">
                    <Star className="w-5 h-5 text-primary fill-[#2D6A4F]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Completion message */}
        {progress === 100 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-[#2D6A4F]/20 border border-primary/30 text-center"
          >
            <h2 className="text-2xl font-bold text-ink mb-2">
              {t("allDone")}
            </h2>
            <p className="text-fg mb-4">
              {t("allDoneDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/${locale}/cerca`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
              >
                <Search className="w-5 h-5" />
                {t("findRide")}
              </Link>
              <Link
                href={`/${locale}/offri`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface text-ink font-semibold hover:bg-sand-deep transition-colors"
              >
                <Car className="w-5 h-5" />
                {t("offerRide")}
              </Link>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-faint">
            {t("footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
