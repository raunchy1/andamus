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
  Siren
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface OnboardingModalProps {
  onComplete?: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    // Check if user has already seen onboarding
    const onboardingDone = localStorage.getItem("onboarding_done");
    if (!onboardingDone && !hasChecked) {
      setIsOpen(true);
      setHasChecked(true);
    }
  }, [hasChecked]);

  const steps = [
    {
      title: "Benvenuto su Andamus! 🚗",
      description: "L'app di carpooling per la Sardegna. Viaggia insieme, risparmia e conosci nuove persone.",
      icon: <Car className="w-16 h-16 text-[#e63946]" />,
      color: "from-[#e63946] to-[#c92a37]",
    },
    {
      title: "Cerca un passaggio",
      description: "Trova corse disponibili in tutta la Sardegna. Filtra per data, prezzo e città. Prenota in pochi click!",
      icon: <Search className="w-16 h-16 text-blue-400" />,
      color: "from-blue-500 to-blue-600",
      features: [
        { icon: MapPin, text: "50+ città coperte" },
        { icon: Star, text: "Valutazioni utenti" },
      ],
    },
    {
      title: "Offri un passaggio",
      description: "Hai posti liberi in macchina? Pubblica una corsa e guadagna punti bonus per ogni passeggero trasportato!",
      icon: <Car className="w-16 h-16 text-green-400" />,
      color: "from-green-500 to-green-600",
      features: [
        { icon: Star, text: "Guadagna punti" },
        { icon: Shield, text: "Utenti verificati" },
      ],
    },
    {
      title: "Chat e Sicurezza",
      description: "Comunica con autisti e passeggeri via chat. Usa il pulsante SOS in caso di emergenza. Valuta gli utenti dopo ogni viaggio.",
      icon: <Shield className="w-16 h-16 text-purple-400" />,
      color: "from-purple-500 to-purple-600",
      features: [
        { icon: MessageCircle, text: "Chat integrata" },
        { icon: Siren, text: "Pulsante SOS" },
      ],
    },
    {
      title: "Sei pronto! 🎉",
      description: "Inizia a usare Andamus. Cerca una corsa o pubblica la tua prima offerta!",
      icon: <Star className="w-16 h-16 text-yellow-400" />,
      color: "from-yellow-500 to-orange-500",
      isFinal: true,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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
    localStorage.setItem("onboarding_done", "true");
    setIsOpen(false);
    onComplete?.();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg mx-4"
      >
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          Salta
          <X className="w-4 h-4" />
        </button>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl bg-[#1a1a2e] border border-white/10 shadow-2xl">
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentStepData.color} opacity-10`} />

          {/* Content */}
          <div className="relative p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="flex justify-center mb-6"
                >
                  <div className={`p-6 rounded-2xl bg-gradient-to-br ${currentStepData.color} bg-opacity-20`}>
                    {currentStepData.icon}
                  </div>
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-4">
                  {currentStepData.title}
                </h2>

                {/* Description */}
                <p className="text-white/70 mb-6 leading-relaxed">
                  {currentStepData.description}
                </p>

                {/* Features (if any) */}
                {currentStepData.features && (
                  <div className="flex justify-center gap-4 mb-6">
                    {currentStepData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2"
                      >
                        <feature.icon className="w-4 h-4 text-[#e63946]" />
                        <span className="text-sm text-white/80">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Step CTA Buttons */}
                {currentStepData.isFinal && (
                  <div className="flex flex-col gap-3 mt-8">
                    <Link
                      href={`/${locale}/cerca`}
                      onClick={handleComplete}
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[#e63946] text-white font-semibold hover:bg-[#c92a37] transition-colors"
                    >
                      <Search className="w-5 h-5" />
                      Cerca una corsa
                    </Link>
                    <Link
                      href={`/${locale}/offri`}
                      onClick={handleComplete}
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                    >
                      <Car className="w-5 h-5" />
                      Offri un passaggio
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-8 mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-[#e63946]"
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            {!currentStepData.isFinal && (
              <div className="flex justify-between items-center">
                {/* Previous Button */}
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
                  Indietro
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-6 py-3 rounded-xl bg-[#e63946] text-white font-semibold hover:bg-[#c92a37] transition-colors"
                >
                  {currentStep === steps.length - 2 ? "Inizia" : "Avanti"}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step Counter */}
        <div className="text-center mt-4">
          <span className="text-white/40 text-sm">
            Passo {currentStep + 1} di {steps.length}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
