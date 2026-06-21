"use client";

import { useState, useEffect, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ProgressBar from "./components/ProgressBar";

// Dynamically load steps with Next.js code splitting
const StepWelcome = dynamic(() => import("./components/StepWelcome"), {
  loading: () => <StepLoader />,
});
const StepProfile = dynamic(() => import("./components/StepProfile"), {
  loading: () => <StepLoader />,
});
const StepRole = dynamic(() => import("./components/StepRole"), {
  loading: () => <StepLoader />,
});
const StepNotifications = dynamic(() => import("./components/StepNotifications"), {
  loading: () => <StepLoader />,
});
const StepComplete = dynamic(() => import("./components/StepComplete"), {
  loading: () => <StepLoader />,
});

function StepLoader() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12">
      <Loader2 className="size-8 animate-spin text-accent" strokeWidth={1.5} />
    </div>
  );
}

interface OnboardingData {
  fullName: string;
  phone: string;
  bio: string;
  birthYear: number;
  avatarUrl: string;
  role: "driver" | "passenger" | "both" | "";
  preferredZones: string[];
  pushNotificationsEnabled: boolean;
}

export default function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const { locale } = use(params);
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  // Authentication & Initial Loading states
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Flow State
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"next" | "back">("next");

  const [data, setData] = useState<OnboardingData>({
    fullName: "",
    phone: "",
    bio: "",
    birthYear: 0,
    avatarUrl: "",
    role: "",
    preferredZones: [],
    pushNotificationsEnabled: false,
  });

  // Verify auth on mount and prefill Google name
  useEffect(() => {
    const initOnboarding = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          router.replace(`/${locale}/join`);
          return;
        }

        // Check if user has already completed onboarding to prevent re-onboarding
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarding_completed, onboarding_step, name, phone, bio, birth_year, avatar_url, role, preferred_zones, push_notifications_enabled")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profile?.onboarding_completed) {
          router.replace(`/${locale}/profilo`);
          return;
        }

        setUser(currentUser);
        
        // Prefill display name from Google metadata
        const googleName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "";
        
        setData({
          fullName: profile?.name || googleName,
          phone: profile?.phone || "",
          bio: profile?.bio || "",
          birthYear: profile?.birth_year || 0,
          avatarUrl: profile?.avatar_url || currentUser.user_metadata?.avatar_url || "",
          role: (profile?.role as OnboardingData["role"]) || "",
          preferredZones: profile?.preferred_zones || [],
          pushNotificationsEnabled: profile?.push_notifications_enabled || false,
        });

        // Restore step if they abandoned it halfway through
        if (profile?.onboarding_step && profile.onboarding_step > 1 && profile.onboarding_step <= 4) {
          setStep(profile.onboarding_step);
        }

      } catch (err) {
        console.error("[onboarding] init failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initOnboarding();
  }, [router, locale, supabase]);

  const handleNextStep = () => {
    setDirection("next");
    setStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setDirection("back");
    setStep((prev) => prev - 1);
  };

  // Immediate save handlers for each step completion
  const handleProfileComplete = async (profileUpdates: {
    fullName: string;
    phone: string;
    bio: string;
    birthYear: number;
    avatarUrl: string;
  }) => {
    if (!user) return;

    setData((prev) => ({ ...prev, ...profileUpdates }));

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profileUpdates.fullName,
        phone: profileUpdates.phone,
        bio: profileUpdates.bio,
        birth_year: profileUpdates.birthYear,
        avatar_url: profileUpdates.avatarUrl,
        onboarding_step: 2,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Supabase Profile Update Error:", error.message);
      toast.error("Salvataggio non riuscito. Controlla la connessione.");
      return;
    }

    handleNextStep();
  };

  const handleRoleComplete = async (roleUpdates: {
    role: "driver" | "passenger" | "both";
    preferredZones: string[];
  }) => {
    if (!user) return;

    setData((prev) => ({ ...prev, ...roleUpdates }));

    const { error } = await supabase
      .from("profiles")
      .update({
        role: roleUpdates.role,
        preferred_zones: roleUpdates.preferredZones,
        onboarding_step: 3,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Supabase Role Update Error:", error.message);
      toast.error("Salvataggio non riuscito. Controlla la connessione.");
      return;
    }

    handleNextStep();
  };

  const handleNotificationsComplete = async (enabled: boolean) => {
    if (!user) return;

    setData((prev) => ({ ...prev, pushNotificationsEnabled: enabled }));

    const { error } = await supabase
      .from("profiles")
      .update({
        push_notifications_enabled: enabled,
        onboarding_step: 4,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Supabase Notifications Update Error:", error.message);
      toast.error("Salvataggio non riuscito. Controlla la connessione.");
      return;
    }

    handleNextStep();
  };

  const handleSkipRole = async () => {
    if (!user) return;
    
    // Default fallback values if skipped
    await supabase
      .from("profiles")
      .update({
        role: "both",
        preferred_zones: ["Cagliari"],
        onboarding_step: 3,
      })
      .eq("id", user.id);

    handleNextStep();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="size-12 animate-spin text-accent" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-[100dvh] select-none flex-col items-center justify-between overflow-hidden bg-bg text-fg">
      {step <= 4 && (
        <div className="flex w-full max-w-md flex-col gap-2 px-6 pt-6">
          <div className="flex items-center justify-between font-mono text-[10px] text-dim">
            <span>step {step} di 4</span>
            <span>{Math.round((step / 4) * 100)}% completato</span>
          </div>
          <ProgressBar currentStep={step} totalSteps={4} />
        </div>
      )}

      {/* Main Content Area with CSS Slide transition */}
      <div className="flex-1 w-full max-w-md px-6 py-6 flex flex-col justify-between relative">
        <div
          className={`flex-1 flex flex-col justify-between transition-all duration-300 ${
            direction === "next" 
              ? "animate-[slide-left_0.35s_ease-out]" 
              : "animate-[slide-right_0.35s_ease-out]"
          }`}
          key={step}
        >
          {step === 1 && (
            <StepWelcome 
              displayName={user?.user_metadata?.full_name || ""} 
              onNext={handleNextStep} 
            />
          )}
          
          {step === 2 && (
            <StepProfile
              userId={user?.id || ""}
              initialData={data}
              onNext={handleProfileComplete}
              onBack={handleBackStep}
            />
          )}

          {step === 3 && (
            <StepRole
              initialData={data}
              onNext={handleRoleComplete}
              onBack={handleBackStep}
              onSkip={handleSkipRole}
            />
          )}

          {step === 4 && (
            <StepNotifications 
              onNext={handleNotificationsComplete} 
              onBack={handleBackStep} 
            />
          )}

          {step === 5 && (
            <StepComplete locale={locale} />
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-left {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-right {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
