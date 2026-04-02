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
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface OnboardingModalProps {
  onComplete?: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (hasChecked) return;
    const onboardingDone = localStorage.getItem("onboarding_done_v2");
    if (!onboardingDone) {
      const t = setTimeout(() => {
        setIsOpen(true);
        setHasChecked(true);
      }, 800);
      return () => clearTimeout(t);
    }
    setHasChecked(true);
  }, [hasChecked]);

  const steps = [
    {
      title: "Il carpooling dei sardi 🚗",
      description:
        "Benvenuto su Andamus! L'app creata per chi vive e viaggia in Sardegna. Connettiti con altri passeggeri, risparmia sui costi e riduci le emissioni.",
      icon: <Car className="w-14 h-14 text-[#e63946]" />,
      color: "from-[#e63946] to-[#c92a37]",
    },
    {
      title: "Cum cauți un passaggio",
      description:
        "Cerca corse disponibili in tutta la Sardegna. Filtra per data, prezzo e città. Prenota in pochi click e ricevi conferma direttamente dall'autista!",
      icon: <Search className="w-14 h-14 text-[#ffb3b1]" />,
      color: "from-[#e63946] to-[#ffb3b1]",
      features: [
        { icon: MapPin, text: "50+ città coperte" },
        { icon: Star, text: "Valutazioni reali" },
      ],
    },
    {
      title: "Cum postezi un passaggio",
      description:
        "Hai posti liberi in macchina? Pubblica una corsa in meno di un minuto. Guadagna punti esperienza per ogni passeggero trasportato e scala la classifica!",
      icon: <Car className="w-14 h-14 text-green-400" />,
      color: "from-green-500 to-emerald-600",
      features: [
        { icon: Trophy, text: "Guadagna punti" },
        { icon: Users, text: "Utenti verificati" },
      ],
    },
    {
      title: "Chat & Siguranță",
      description:
        "Comunica facilmente con autisti e passeggeri tramite la chat integrata. In caso di emergenza, il pulsante SOS è sempre a portata di mano per chiamare il 112.",
      icon: <Shield className="w-14 h-14 text-blue-400" />,
      color: "from-blue-500 to-indigo-600",
      features: [
        { icon: MessageCircle, text: "Chat in-app" },
        { icon: Siren, text: "Pulsante SOS" },
      ],
    },
    {
      title: "Comunitate & puncte",
      description:
        "Fai parte di una community affidabile. Completa azioni, guadagna punti, sblocca livelli e costruisci la tua reputazione con recensioni autentiche.",
      icon: <Trophy className="w-14 h-14 text-yellow-400" />,
      color: "from-yellow-500 to-orange-500",
      features: [
        { icon: Star, text: "Livelli e badge" },
        { icon: Users, text: "Community sarda" },
      ],
    },
    {
      title: "Sunt gata! 🎉",
      description:
        "Tutto pronto per iniziare. Cerca subito una corsa o pubblica la tua prima offerta. Insieme rendiamo i viaggi in Sardegna più smart e sostenibili!",
      icon: <Star className="w-14 h-14 text-[#ffb3b1]" />,
      color: "from-[#e63946] to-[#ffb3b1]",
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
    localStorage.setItem("onboarding_done_v2", "true");
    setIsOpen(false);
    onComplete?.();
    // Redirect to search with welcome toast
    router.push(`/${locale}/cerca`);
    setTimeout(() => {
      toast.success("Benvenuto su Andamus! 🎉 Inizia a cercare passaggi in Sardegna.");
    }, 500);
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

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
          Salta
          <X className="w-4 h-4" />
        </button>

        <div className="relative overflow-hidden rounded-3xl bg-[#131313] border border-white/10 shadow-2xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${currentStepData.color} opacity-8`} />

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
                  <div className={`p-5 rounded-2xl bg-gradient-to-br ${currentStepData.color} bg-opacity-15`}>
                    {currentStepData.icon}
                  </div>
                </motion.div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  {currentStepData.title}
                </h2>

                <p className="text-white/70 mb-5 leading-relaxed text-sm sm:text-base">
                  {currentStepData.description}
                </p>

                {currentStepData.features && (
                  <div className="flex flex-wrap justify-center gap-3 mb-5">
                    {currentStepData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/5"
                      >
                        <feature.icon className="w-4 h-4 text-[#e63946]" />
                        <span className="text-sm text-white/90">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentStepData.isFinal && (
                  <div className="flex flex-col gap-3 mt-6">
                    <Link
                      href={`/${locale}/cerca`}
                      onClick={handleComplete}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#e63946] text-white font-semibold hover:bg-[#c92a37] transition-colors"
                    >
                      <Search className="w-5 h-5" />
                      Caută o corsă
                    </Link>
                    <Link
                      href={`/${locale}/offri`}
                      onClick={handleComplete}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                    >
                      <Car className="w-5 h-5" />
                      Oferă un passaggio
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-6 mb-5">
              {steps.map((_, index) => (
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

            {!currentStepData.isFinal && (
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
                  Indietro
                </button>

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

        <div className="text-center mt-4">
          <span className="text-white/40 text-sm">
            Passo {currentStep + 1} di {steps.length}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
