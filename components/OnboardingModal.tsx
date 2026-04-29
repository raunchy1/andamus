"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Car,
  Shield,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Star,
  Siren,
  Users,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface OnboardingModalProps {
  onComplete?: () => void;
}

const ICONS = [Car, Search, Car, Shield, Trophy, Star];
const COLORS = [
  "from-[#e63946] to-[#c92a37]",
  "from-[#e63946] to-[#ffb3b1]",
  "from-green-500 to-emerald-600",
  "from-blue-500 to-indigo-600",
  "from-yellow-500 to-orange-500",
  "from-[#e63946] to-[#ffb3b1]",
];

const FEATURE_ICONS: Array<Array<React.ElementType>> = [
  [],
  [MapPin, Star],
  [Trophy, Users],
  [MessageCircle, Siren],
  [Star, Users],
  [],
];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("onboarding.modal");

  useEffect(() => {
    if (hasChecked) return;
    const onboardingDone = localStorage.getItem("onboarding_done_v2");
    if (!onboardingDone) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasChecked(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    Promise.resolve().then(() => setHasChecked(true));
  }, [hasChecked]);

  const slides = t.raw("slides") as Array<{
    title: string;
    description: string;
    features?: Array<{ text: string }>;
  }>;

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_done_v2", "true");
    setIsOpen(false);
    onComplete?.();
    router.push(`/${locale}/cerca`);
    setTimeout(() => {
      toast.success(t("welcomeToast"));
    }, 500);
  };

  if (!isOpen) return null;

  const currentSlide = slides[currentStep];
  const IconComponent = ICONS[currentStep];
  const currentColor = COLORS[currentStep];
  const currentFeatureIcons = FEATURE_ICONS[currentStep] || [];
  const isFinal = currentStep === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={handleSkip}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md mx-4"
      >
        <button
          onClick={handleSkip}
          className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          {t("skip")}
          <X className="w-4 h-4" />
        </button>

        <div className="relative overflow-hidden rounded-3xl bg-[#131313] border border-white/10 shadow-2xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${currentColor} opacity-8`} />

          <div className="relative p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.28 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, type: "spring" }}
                  className="flex justify-center mb-5"
                >
                  <div className={`p-5 rounded-2xl bg-gradient-to-br ${currentColor} bg-opacity-15`}>
                    <IconComponent className="w-14 h-14 text-[#e63946]" />
                  </div>
                </motion.div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  {currentSlide.title}
                </h2>

                <p className="text-white/70 mb-5 leading-relaxed text-sm sm:text-base">
                  {currentSlide.description}
                </p>

                {currentSlide.features && currentSlide.features.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3 mb-5">
                    {currentSlide.features.map((feature, index) => {
                      const FeatureIcon = currentFeatureIcons[index] || Star;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/5"
                        >
                          <FeatureIcon className="w-4 h-4 text-[#e63946]" />
                          <span className="text-sm text-white/90">{feature.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isFinal && (
                  <div className="flex flex-col gap-3 mt-6">
                    <Link
                      href={`/${locale}/cerca`}
                      onClick={handleComplete}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#e63946] text-white font-semibold hover:bg-[#c92a37] transition-colors"
                    >
                      <Search className="w-5 h-5" />
                      {t("searchRide")}
                    </Link>
                    <Link
                      href={`/${locale}/offri`}
                      onClick={handleComplete}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                    >
                      <Car className="w-5 h-5" />
                      {t("offerRide")}
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-6 mb-5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-[#e63946]"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            {!isFinal && (
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    currentStep === 0
                      ? "text-white/20 cursor-not-allowed"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  {t("back")}
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-6 py-3 rounded-xl bg-[#e63946] text-white font-semibold hover:bg-[#c92a37] transition-colors"
                >
                  {currentStep === slides.length - 2 ? t("start") : t("next")}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-4">
          <span className="text-white/40 text-sm">
            {t("step", { current: currentStep + 1, total: slides.length })}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
